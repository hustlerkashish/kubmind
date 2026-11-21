package io.kubemind.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.kubemind.backend.dto.copilot.CopilotChatRequest;
import io.kubemind.backend.dto.copilot.CopilotChatResponse;
import io.kubemind.backend.dto.copilot.CopilotDiagnosisDto;
import io.kubemind.backend.entity.ChatMessage;
import io.kubemind.backend.entity.ChatSession;
import io.kubemind.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CopilotChatService {

    private final ChatHistoryService chatHistoryService;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplateBuilder restTemplateBuilder;

    @Value("${AI_SERVICE_URL:http://ai-service.kubemind.svc.cluster.local:8000}")
    private String aiServiceUrl;

    @Value("${INTERNAL_API_KEY:}")
    private String internalApiKey;

    @Transactional
    public CopilotChatResponse chat(
            java.util.UUID sessionId,
            java.util.UUID userId,
            CopilotChatRequest request) {

        ChatSession session =
                chatHistoryService.getOwnedSession(sessionId, userId);

        if (internalApiKey == null || internalApiKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI service authentication is not configured");
        }

        // Do not save a message unless the AI request succeeds.
        CopilotChatResponse aiResponse = callAiService(request);

        String tools = String.join(",", aiResponse.getToolsExecuted());

        ChatMessage userMessage = ChatMessage.builder()
                .session(session)
                .sender("user")
                .content(request.getMessage().trim())
                .modelName("user")
                .build();

        ChatMessage assistantMessage = ChatMessage.builder()
                .session(session)
                .sender("assistant")
                .content(aiResponse.getReply())
                .toolsExecuted(tools)
                .confidenceScore(aiResponse.getDiagnosis() != null
                        ? aiResponse.getDiagnosis().getConfidenceScore()
                        : null)
                .remediationCommand(aiResponse.getDiagnosis() != null
                        ? aiResponse.getDiagnosis().getRemediationCommand()
                        : null)
                .modelName("ai-service")
                .toolResponse(tools.isBlank() ? null : tools)
                .build();

        chatMessageRepository.save(userMessage);
        chatMessageRepository.save(assistantMessage);

        return aiResponse;
    }

    private CopilotChatResponse callAiService(CopilotChatRequest request) {

        String baseUrl = aiServiceUrl.replaceAll("/+$", "");

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", request.getMessage());
        payload.put("namespace", request.getNamespace());
        payload.put("podName", request.getPodName());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-API-Key", internalApiKey);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(payload, headers);

        RestTemplate client = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(45))
                .build();

        try {
            ResponseEntity<String> result = client.exchange(
                    baseUrl + "/api/v1/copilot/chat",
                    HttpMethod.POST,
                    entity,
                    String.class);

            if (result.getBody() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "AI service returned an empty response");
            }

            return parseAiResponse(result.getBody());

        } catch (HttpStatusCodeException ex) {
            log.error("AI service HTTP failure: {}", ex.getStatusCode());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "AI diagnostic service rejected or failed the request");

        } catch (ResourceAccessException ex) {
            log.error("AI service connection or timeout failure");
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI diagnostic service is currently unreachable");

        } catch (ResponseStatusException ex) {
            throw ex;

        } catch (Exception ex) {
            log.error("AI response processing failed: {}", ex.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Could not process the AI service response");
        }
    }

    private CopilotChatResponse parseAiResponse(String body) throws Exception {

        JsonNode root = objectMapper.readTree(body);

        String status = root.path("status").asText("");
        String reply = root.path("reply").asText("");

        if (!"SUCCESS".equalsIgnoreCase(status) || reply.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "AI service did not return a successful diagnosis");
        }

        List<String> tools = new ArrayList<>();
        JsonNode toolsNode = root.path("toolsExecuted");

        if (toolsNode.isArray()) {
            toolsNode.forEach(tool -> {
                if (tool.isTextual() && !tool.asText().isBlank()) {
                    tools.add(tool.asText());
                }
            });
        }

        CopilotDiagnosisDto diagnosis = null;
        JsonNode diagnosisNode = root.path("diagnosis");

        if (diagnosisNode.isObject()) {
            diagnosis = objectMapper.treeToValue(
                    diagnosisNode, CopilotDiagnosisDto.class);
        }

        return CopilotChatResponse.builder()
                .status(status)
                .reply(reply)
                .toolsExecuted(tools)
                .diagnosis(diagnosis)
                .build();
    }
}
