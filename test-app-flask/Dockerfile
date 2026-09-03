FROM python:3

WORKDIR /usr/src/app


ENV WATCHPACK_POLLING=true
COPY . .
# do pip install when building
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install --no-cache-dir --root-user-action ignore -r requirements.txt

EXPOSE 8000