FROM python:3

RUN groupadd -r python && useradd --no-log-init -r -g python python
RUN mkdir --parents /venv /home/python /usr/src/VaseLabFlask
RUN chown -R python:python /venv /home/python /usr/src

USER python
ENV PATH="/venv/bin:$PATH"
ENV FLASK_APP=main:create_app

RUN python3 -m venv /venv
COPY requirements.txt /venv
RUN pip install -r /venv/requirements.txt

WORKDIR /usr/src/VaseLabFlask
COPY --chown=python . .

EXPOSE 8000