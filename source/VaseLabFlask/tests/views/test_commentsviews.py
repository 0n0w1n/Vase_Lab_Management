import os
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from VaseLabFlask.extensions import db
from VaseLabFlask.main import create_app
from VaseLabFlask.models import ActivityLog, Request, User


class RequestCommentsTest(TestCase):
    def setUp(self):
        uploads = self.enterContext(TemporaryDirectory())
        with patch.dict(os.environ, SECRET_KEY="test", JWT_SECRET_KEY="x" * 32,
                        DATABASE_URL="sqlite://"):
            app = create_app({"TESTING": True, "UPLOAD_ROOT": uploads})
        self.client = app.test_client()
        self.app = app
        with app.app_context():
            db.create_all()
            self.headers = {}
            for name, role in [("Request Owner", "lab_member"), ("Staff", "lab_ta"),
                               ("Other", "lab_member")]:
                user = User(UserFullName=name, Email=f"{role}{len(self.headers)}@example.test",
                            PasswordHash="unused", UserRole=role)
                db.session.add(user)
                db.session.flush()
                self.headers[name] = {"Authorization": f"Bearer {create_access_token(identity=user)}"}
                if role == "lab_member":
                    db.session.add(Request(RequestTitle=name, UserID=user.UserID))
            db.session.commit()
            self.urls = {
                req.RequestTitle: f"/request/{req.RequestID}/comments"
                for req in db.session.scalars(db.select(Request))
            }
        self.url = self.urls["Request Owner"]

    def test_saved_thread_is_shared_ordered_and_scoped_to_its_request(self):
        owner = self.headers["Request Owner"]
        staff = self.headers["Staff"]
        first = self.client.post(self.url, headers=owner, json={"Comment": "  Bonjour !  "})
        second = self.client.post(self.url, headers=staff, json={"Comment": "Merci"})
        self.assertEqual((first.status_code, second.status_code), (201, 201))

        fresh_client = self.app.test_client()
        for reader in (owner, staff):
            response = fresh_client.get(self.url, headers=reader)
            self.assertEqual(response.status_code, 200)
            messages = response.get_json()
            self.assertEqual([m["id"] for m in messages], [first.json["id"], second.json["id"]])
            self.assertEqual([m["body"] for m in messages], ["Bonjour !", "Merci"])
            self.assertEqual(messages[0]["author"], {"name": "Request Owner", "initials": "RO"})
            self.assertEqual(messages[1]["author"]["name"], "Staff")
            self.assertTrue(all(m["at"].endswith("Z") for m in messages))
        self.assertEqual(fresh_client.get(self.urls["Other"], headers=staff).json, [])
        with self.app.app_context():
            logs = db.session.scalars(db.select(ActivityLog).where(ActivityLog.EntityType == "comment"))
            self.assertEqual({str(log.EntityID) for log in logs}, {first.json["id"], second.json["id"]})

    def test_access_checks_apply_to_reading_and_posting(self):
        for method in ("GET", "POST"):
            for url, headers, status in [
                (self.url, {}, 401),
                (self.url, self.headers["Other"], 403),
                ("/request/999/comments", self.headers["Staff"], 404),
            ]:
                with self.subTest(method=method, status=status):
                    response = self.client.open(url, method=method, headers=headers, json={"Comment": "Hi"})
                    self.assertEqual(response.status_code, status)
        self.assertEqual(self.client.get(self.url, headers=self.headers["Request Owner"]).json, [])

    def test_invalid_input_is_never_added_to_the_thread(self):
        owner = self.headers["Request Owner"]
        for payload in (None, [], {}, {"Comment": 5}, {"Comment": "  "}, {"Comment": "a" * 1001}):
            with self.subTest(payload_type=type(payload)):
                response = self.client.post(self.url, headers=owner, json=payload)
                self.assertEqual(response.status_code, 400)
                self.assertIn("errorCode", response.json)
        self.assertEqual(self.client.get(self.url, headers=owner).json, [])
        response = self.client.post(self.url, headers=owner, json={"Comment": "a" * 1000})
        self.assertEqual(response.status_code, 201)
