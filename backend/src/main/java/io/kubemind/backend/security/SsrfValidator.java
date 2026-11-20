package io.kubemind.backend.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.util.Set;

@Component
@Slf4j
public class SsrfValidator {

    private static final Set<String> BLOCKED_HOST_NAMES = Set.of(
            "metadata.google.internal",
            "metadata.google",
            "postgres",
            "kubemind-db"
    );

    public static boolean isSafeUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return false;
        }

        try {
            URI uri = URI.create(rawUrl.trim());
            String scheme = uri.getScheme();
            if (scheme == null || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                log.warn("SSRF blocked: Disallowed URL scheme '{}' in candidate URL: {}", scheme, rawUrl);
                return false;
            }

            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                log.warn("SSRF blocked: Missing host in candidate URL: {}", rawUrl);
                return false;
            }

            String lowerHost = host.toLowerCase().trim();
            if (BLOCKED_HOST_NAMES.contains(lowerHost)) {
                log.warn("SSRF blocked: Forbidden target host '{}' in candidate URL: {}", lowerHost, rawUrl);
                return false;
            }

            // Clean bracketed IPv6 notation if present
            String cleanHost = lowerHost;
            if (cleanHost.startsWith("[") && cleanHost.endsWith("]")) {
                cleanHost = cleanHost.substring(1, cleanHost.length() - 1);
            }

            // 1. Literal pattern checks for metadata / link-local / alternative encodings
            if (isCloudMetadataAddress(cleanHost)) {
                log.warn("SSRF blocked: Cloud metadata address detected in candidate URL: {}", rawUrl);
                return false;
            }

            // 2. Resolve host to IP address(es) to detect decimal/hex/octal/IPv6 and DNS rebinding to metadata
            try {
                InetAddress[] addresses = InetAddress.getAllByName(cleanHost);
                for (InetAddress addr : addresses) {
                    if (isProhibitedIpAddress(addr)) {
                        log.warn("SSRF blocked: Prohibited IP address '{}' resolved for host: {}", addr.getHostAddress(), rawUrl);
                        return false;
                    }
                }
            } catch (Exception e) {
                // Host resolution may fail for mock or Docker-internal names without DNS; allowed if not blocked above
                log.debug("DNS check info for host '{}': {}", cleanHost, e.getMessage());
            }

            return true;
        } catch (Exception e) {
            log.warn("SSRF blocked: Invalid URL '{}': {}", rawUrl, e.getMessage());
            return false;
        }
    }

    private static boolean isCloudMetadataAddress(String host) {
        if (host.equals("169.254.169.254") || host.equals("100.100.100.200") || host.startsWith("169.254.")) {
            return true;
        }
        // Hexadecimal / Decimal representations of 169.254.169.254
        if (host.equalsIgnoreCase("0xa9fea9fe") || host.equals("2852039166")) {
            return true;
        }
        return false;
    }

    public static boolean isProhibitedIpAddress(InetAddress addr) {
        if (addr == null) {
            return true;
        }

        // Link-local (169.254.x.x, fe80::/10) - contains cloud metadata
        if (addr.isLinkLocalAddress()) {
            return true;
        }

        byte[] raw = addr.getAddress();
        if (raw == null || raw.length < 4) {
            return true;
        }

        // IPv4 checks
        if (raw.length == 4) {
            int b0 = raw[0] & 0xFF;
            int b1 = raw[1] & 0xFF;
            // 169.254.x.x link-local / metadata
            if (b0 == 169 && b1 == 254) {
                return true;
            }
            // 100.100.100.200 (Alibaba cloud metadata)
            if (b0 == 100 && b1 == 100 && (raw[2] & 0xFF) == 100 && (raw[3] & 0xFF) == 200) {
                return true;
            }
        }

        // IPv6 link-local / metadata
        if (raw.length == 16) {
            // Check IPv4-mapped IPv6: ::ffff:169.254.169.254
            if (raw[0] == 0 && raw[1] == 0 && raw[2] == 0 && raw[3] == 0 &&
                raw[4] == 0 && raw[5] == 0 && raw[6] == 0 && raw[7] == 0 &&
                raw[8] == 0 && raw[9] == 0 && (raw[10] & 0xFF) == 0xFF && (raw[11] & 0xFF) == 0xFF) {
                int b0 = raw[12] & 0xFF;
                int b1 = raw[13] & 0xFF;
                if (b0 == 169 && b1 == 254) {
                    return true;
                }
            }
        }

        return false;
    }
}
