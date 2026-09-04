FROM python:3.12
WORKDIR /app/agent
COPY ./requirements.txt .
#RUN python -m venv venv && . venv/bin/activate
RUN pip install -r requirements.txt
COPY . .
WORKDIR /app/agent/autogen
CMD ["python", "./main.py"]
EXPOSE 8000
