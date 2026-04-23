# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Simone Bianchelli
#

import sys
from pathlib import Path

# Add parent directory to path to import common
sys.path.insert(0, str(Path(__file__).parent.parent))

from locust import run_single_user, task, between
from common import AuthenticatedUser
import random


# Available topics from chatbot initial suggestions
TOPICS = [
    {"id": "participate_tool", "text": "What can I do in EU LDT Participate Tool?"},
    {"id": "participatory_process", "text": "What is a participatory process?"},
    {"id": "assemblies", "text": "What are assemblies?"},
    {"id": "conferences", "text": "What are conferences?"},
    {"id": "initiatives", "text": "What are initiatives?"}
]


class ChatbotLoadTest(AuthenticatedUser):
    """
    Load test for chatbot endpoints with OAuth2 authentication.
    Simulates realistic user conversations through the chatbot.
    
    User flow:
    1. Start conversation (get initial suggestions)
    2. Select topic by nodeId
    3. After answer, either:
       - Switch topic (restart conversation)
       - Further support (send custom question)
    """
    context_path = '/chatbot-backend-api/api/v1'
    wait_time = between(2, 5)  # Wait 2-5 seconds between tasks (realistic user behavior)

    def on_start(self):
        """Initialize conversation when user starts"""
        # Call parent on_start for authentication
        super().on_start()
        
        # Step 1: Start conversation
        print(f"[Chatbot] Attempting to start conversation at {self.context_path}/chat/")
        print(f"[Chatbot] Available cookies: {list(self.client.cookies.keys())}")
        
        with self.catch_401(
            self.client.post,
            f"{self.context_path}/chat/",
            json={"language": "en"},
            name="Chatbot - Start Conversation",
            catch_response=True
        ) as response:
            print(f"[Chatbot] Start conversation response status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                self.conversation_id = data.get("conversationId")
                self.faqs = data.get("faqs", [])
                print(f"[Chatbot] Conversation started: {self.conversation_id}")
            else:
                print(f"[Chatbot] ERROR: Failed to start conversation - Status {response.status_code}")
                print(f"[Chatbot] Response body: {response.text[:500]}")
                response.failure(f"Failed to start conversation: {response.status_code}")
                self.conversation_id = None
                return

        # Step 2: Select random topic from suggestions
        self.selected_topic = random.choice(TOPICS)
        with self.catch_401(
            self.client.post,
            f"{self.context_path}/chat/",
            json={
                "conversationId": self.conversation_id,
                "nodeId": self.selected_topic["id"],
                "language": "en"
            },
            name=f"Chatbot - Select Topic ({self.selected_topic['text']})",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.is_leaf = data.get("isLeaf", False)
                print(f"[Chatbot] Topic '{self.selected_topic['text']}' selected")
                print(f"[Chatbot] Is leaf node: {self.is_leaf}")
            else:
                response.failure(f"Failed to select topic: {response.status_code}")

    @task(6)
    def switch_topic(self):
        """
        Simulate user clicking "Switch topic" to restart conversation.
        This happens more frequently (weight=6) as users often explore multiple topics.
        60% of users browse topics to find quick answers.
        """
        if not hasattr(self, 'conversation_id') or not self.conversation_id:
            print("[Chatbot] No conversation ID, skipping topic switch")
            return
        
        # Restart conversation to get new suggestions
        with self.catch_401(
            self.client.post,
            f"{self.context_path}/chat/",
            json={"language": "en"},
            name="Chatbot - Switch Topic (Restart)",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.conversation_id = data.get("conversationId")
                print(f"[Chatbot] Topic switched, new conversation: {self.conversation_id}")
                
                # Select a new random topic
                self.selected_topic = random.choice(TOPICS)
                with self.catch_401(
                    self.client.post,
                    f"{self.context_path}/chat/",
                    json={
                        "conversationId": self.conversation_id,
                        "nodeId": self.selected_topic["id"],
                        "language": "en"
                    },
                    name=f"Chatbot - Select New Topic ({self.selected_topic['text']})",
                    catch_response=True
                ) as topic_response:
                    if topic_response.status_code == 200:
                        print(f"[Chatbot] New topic '{self.selected_topic['text']}' selected")
                    else:
                        topic_response.failure(f"Failed to select new topic: {topic_response.status_code}")
            else:
                response.failure(f"Failed to switch topic: {response.status_code}")



if __name__ == "__main__":
    run_single_user(ChatbotLoadTest)