import os
import time
from locust import HttpUser, TaskSet, task, between

class UserBehavior(TaskSet):
    @task(3)
    def get_home(self):
        """
        Simulate a user GET request to the homepage
        """
        self.client.get("/")

    @task(1)
    def search(self):
        """
        Simulate a user performing a search via query parameter
        """
        self.client.get("/search", params={"q": "locust"})

class WebsiteUser(HttpUser):
    tasks = [UserBehavior]
    # Wait time between tasks: simulate realistic think time (1 to 5 seconds)
    wait_time = between(1, 5)
    # Base URL of the target system under test
    host = "http://localhost:8000"  # Change to your application's URL