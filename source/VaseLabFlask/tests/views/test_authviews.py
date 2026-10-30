def test_auth(auth):
    token = auth.login()
    print(token)
    assert isinstance(token, str)
    assert len(token) > 0