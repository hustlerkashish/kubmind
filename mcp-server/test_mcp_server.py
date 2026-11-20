import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["INTERNAL_API_KEY"] = "test-secret-key-12345"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000,https://app.kubemind.io"

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
import main

class TestMCPServerSecurity(unittest.TestCase):

    def setUp(self):
        main.INTERNAL_API_KEY = "test-secret-key-12345"

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
        result = main.verify_internal_auth(api_key="test-secret-key-12345", bearer=None)
        self.assertTrue(result)

    def test_verify_auth_valid_bearer_succeeds(self):
        bearer = HTTPAuthorizationCredentials(scheme="Bearer", credentials="test-secret-key-12345")
        result = main.verify_internal_auth(api_key=None, bearer=bearer)
        self.assertTrue(result)

    def test_list_tools_returns_all_tools(self):
        res = main.list_tools()
        self.assertIn("tools", res)
        self.assertGreater(len(res["tools"]), 0)

if __name__ == "__main__":
    unittest.main()
