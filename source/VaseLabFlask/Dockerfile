FROM python:3

RUN groupadd -r python && useradd --no-log-init -r -g python python
RUN mkdir --parents /venv /home/python /usr/src/app
RUN chown -R python:python /venv /home/python /usr/src/app

# Create folder if it doesn't exists , give right to the pyhon user
# to read and write on the folder
RUN mkdir -p /var/lib/vaselab/uploads \
    && chown python:python /var/lib/vaselab/uploads \
    && chmod 700 /var/lib/vaselab/uploads

USER python
ENV PATH="/venv/bin:$PATH"
ENV FLASK_APP=main:create_app

RUN python3 -m venv /venv
COPY requirements.txt /venv
RUN pip install -r /venv/requirements.txt

WORKDIR /usr/src/app
COPY --chown=python . .

EXPOSE 8000