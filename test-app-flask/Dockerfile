FROM python:3

WORKDIR /usr/src/app


ENV FLASK_APP=main:create_app
RUN groupadd -r python && useradd --no-log-init -r -g python python

COPY . .
# do pip install when building
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install --no-cache-dir --root-user-action ignore -r requirements.txt

RUN chown -R python:python /usr/src/app
RUN chown -R python:python /venv

EXPOSE 8000