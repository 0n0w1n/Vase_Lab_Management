FROM python:3

WORKDIR /usr/src/app


ENV FLASK_APP=main:create_app

COPY . .
# do pip install when building
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install --no-cache-dir --root-user-action ignore -r requirements.txt


# RUN venv/bin/python3 -m flask db 

EXPOSE 8000