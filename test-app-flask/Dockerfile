FROM python:3

WORKDIR /usr/src/app

# EXPOSE technically not necessary but good practice
EXPOSE 8000

# do pip install when building
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"
COPY requirements.txt .
RUN pip install --no-cache-dir --root-user-action ignore -r requirements.txt
