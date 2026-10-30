import pytest
from VaseLabFlask.main import create_app

from flask import Flask
from flask.testing import FlaskClient, FlaskCliRunner

@pytest.fixture
def app():
    app = create_app({
        "TESTING": True
    })
    yield app

@pytest.fixture
def client(app: Flask):
    return app.test_client()

@pytest.fixture
def runner(app: Flask):
    return app.test_cli_runner()

class AuthActions(object):
    def __init__(self, client: FlaskClient):
        self._client = client

    def login(self, role="admin"):
        ROLES = {
            "admin": ("admin@lab.local", "admin123"),
            "manager": ("manager@lab.local", "manager123"),
            "ta": ("ta@lab.local", "ta123"),
            "member": ("member@lab.local", "member123"),
        }
        data = {
            "email": ROLES[role][0],
            "password": ROLES[role][1]
        }
        print(data)
        response = self._client.post("/auth/login", json=data)
        return response.get_json()

@pytest.fixture
def auth(client: FlaskClient):
    return AuthActions(client)
