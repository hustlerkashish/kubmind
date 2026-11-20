import os
import sys
import unittest
from unittest.mock import MagicMock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["INTERNAL_API_KEY"] = "ai-test-key-99999"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000,https://app.kubemind.io"

# Mock langgraph modules if not installed locally
if 'langgraph' not in sys.modules:
    mock_lg = MagicMock()
    sys.modules['langgraph'] = mock_lg
    sys.modules['langgraph.graph'] = mock_lg

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
import main

class TestAIServiceSecurity(unittest.TestCase):

    def setUp(self):
        main.INTERNAL_API_KEY = "ai-test-key-99999"

    def test_health_check(self):
        res = main.health_check()
        self.assertEqual(res.get("status"), "UP")

    def test_verify_auth_missing_key_raises_401(self):
        with self.assertRaises(HTTPException) as ctx:
            main.verify_internal_auth(api_key=None, bearer=None)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("Unauthorized", ctx.exception.detail)

    def test_verify_auth_invalid_key_raises_401(self):
        with self.assertRaises(HTTPException) as ctx:
            main.verify_internal_auth(api_key="wrong-key", bearer=None)
        self.assertEqual(ctx.exception.status_code, 401)

    def test_verify_auth_valid_api_key_header_succeeds(self):
        result = main.verify_internal_auth(api_key="ai-test-key-99999", bearer=None)
        self.assertTrue(result)

    def test_verify_auth_valid_bearer_succeeds(self):
        bearer = HTTPAuthorizationCredentials(scheme="Bearer", credentials="ai-test-key-99999")
        result = main.verify_internal_auth(api_key=None, bearer=bearer)
        self.assertTrue(result)

if __name__ == "__main__":
    unittest.main()
