# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Simone Bianchelli
#

import random
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path to import common
sys.path.insert(0, str(Path(__file__).parent.parent))

from locust import task, between
from common import AuthenticatedUser


class DecidimUser(AuthenticatedUser):
    """
    Simulates authenticated users browsing public Decidim pages.
    Tests navigation through processes, proposals, meetings, and other components.
    """
    
    # Wait time between tasks (seconds)
    wait_time = between(2, 5)
    
    # Real process slugs from the test environment
    processes = [
        "test",
    ]
    
    # Real assembly slugs from the test environment
    assemblies = [
        "test-mtt",
    ]
    
    # Real component IDs for 'test' process
    # Format: {component_type: (component_id, first_item_id)}
    test_components = {
        "proposals": (51, 2),   # /processes/test/f/51/proposals, first proposal ID: 2
        "debates": (3, 1),       # /processes/test/f/3/debates, first debate ID: 1
        "meetings": (6, 5),      # /processes/test/f/6/meetings, first meeting ID: 5
    }

    @task(10)
    def browse_processes_list(self):
        """
        Navigate to processes list page.
        High weight (10) as this is a common entry point.
        """
        with self.catch_401(
            self.client.get,
            "/processes",
            name="Decidim - Process List",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Browsed process list successfully")
            else:
                response.failure(f"Process list failed: {response.status_code}")

    @task(8)
    def view_process_detail(self):
        """
        View a random process detail page.
        Weight 8 - common user action.
        """
        process = random.choice(self.processes)
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}",
            name="Decidim - Process Detail",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Viewed process: {process}")
            elif response.status_code == 404:
                print(f"[decidim_user] Process not found: {process}")
                response.failure(f"Process not found: {process}")
            else:
                response.failure(f"Process detail failed: {response.status_code}")

    @task(6)
    def browse_proposals(self):
        """
        Browse proposals in the test process.
        Weight 6 - frequent action.
        """
        process = "test"
        component_id = self.test_components["proposals"][0]
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}/f/{component_id}/proposals",
            name="Decidim - Proposals List",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Browsed proposals in {process}")
            elif response.status_code == 404:
                print(f"[decidim_user] Proposals component not found")
                response.failure(f"Proposals not found: {response.status_code}")
            else:
                response.failure(f"Proposals browse failed: {response.status_code}")

    @task(4)
    def view_proposal_detail(self):
        """
        View the first available proposal in the test process.
        Weight 4 - less frequent than browsing lists.
        """
        process = "test"
        component_id, proposal_id = self.test_components["proposals"]
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}/f/{component_id}/proposals/{proposal_id}",
            name="Decidim - Proposal Detail",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Viewed proposal {proposal_id} in {process}")
            elif response.status_code == 404:
                print(f"[decidim_user] Proposal {proposal_id} not found")
                response.failure(f"Proposal not found: {response.status_code}")
            else:
                response.failure(f"Proposal detail failed: {response.status_code}")

    @task(5)
    def browse_debates(self):
        """
        Browse debates in the test process.
        Weight 5 - common action.
        """
        process = "test"
        component_id = self.test_components["debates"][0]
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}/f/{component_id}/debates",
            name="Decidim - Debates List",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Browsed debates in {process}")
            elif response.status_code == 404:
                print(f"[decidim_user] Debates component not found")
                response.failure(f"Debates not found: {response.status_code}")
            else:
                response.failure(f"Debates browse failed: {response.status_code}")
    
    @task(4)
    def view_debate_detail(self):
        """
        View the first available debate in the test process.
        Weight 4 - moderate frequency.
        """
        process = "test"
        component_id, debate_id = self.test_components["debates"]
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}/f/{component_id}/debates/{debate_id}",
            name="Decidim - Debate Detail",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Viewed debate {debate_id} in {process}")
            elif response.status_code == 404:
                print(f"[decidim_user] Debate {debate_id} not found")
                response.failure(f"Debate not found: {response.status_code}")
            else:
                response.failure(f"Debate detail failed: {response.status_code}")
    
    @task(3)
    def browse_meetings(self):
        """
        Browse meetings in the test process.
        Weight 3 - moderate frequency.
        """
        process = "test"
        component_id = self.test_components["meetings"][0]
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}/f/{component_id}/meetings",
            name="Decidim - Meetings List",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Browsed meetings in {process}")
            elif response.status_code == 404:
                print(f"[decidim_user] Meetings component not found")
                response.failure(f"Meetings not found: {response.status_code}")
            else:
                response.failure(f"Meetings browse failed: {response.status_code}")
    
    @task(3)
    def view_meeting_detail(self):
        """
        View the first available meeting in the test process.
        Weight 3 - moderate frequency.
        """
        process = "test"
        component_id, meeting_id = self.test_components["meetings"]
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}/f/{component_id}/meetings/{meeting_id}",
            name="Decidim - Meeting Detail",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Viewed meeting {meeting_id} in {process}")
            elif response.status_code == 404:
                print(f"[decidim_user] Meeting {meeting_id} not found")
                response.failure(f"Meeting not found: {response.status_code}")
            else:
                response.failure(f"Meeting detail failed: {response.status_code}")

    @task(5)
    def browse_assemblies_list(self):
        """
        Navigate to assemblies list page.
        Weight 5 - assemblies are important participatory spaces.
        """
        with self.catch_401(
            self.client.get,
            "/assemblies",
            name="Decidim - Assemblies List",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Browsed assemblies list")
            else:
                response.failure(f"Assemblies list failed: {response.status_code}")

    @task(4)
    def view_assembly_detail(self):
        """
        View a random assembly detail page.
        Weight 4 - common user action.
        """
        assembly = random.choice(self.assemblies)
        
        with self.catch_401(
            self.client.get,
            f"/assemblies/{assembly}",
            name="Decidim - Assembly Detail",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Viewed assembly: {assembly}")
            elif response.status_code == 404:
                print(f"[decidim_user] Assembly not found: {assembly}")
                response.failure(f"Assembly not found: {assembly}")
            else:
                response.failure(f"Assembly detail failed: {response.status_code}")

    @task(3)
    def browse_calendar(self):
        """
        Browse the calendar with different views and filters.
        Weight 3 - moderate frequency.
        Calendar includes meetings, debates, and participatory steps.
        """
        now = datetime.now()
        year = now.year
        month = now.month
        day = now.day
        
        # Random calendar view
        views = ["dayGridWeek", "dayGridDay", "listWeek"]
        view = random.choice(views)
        
        # Calendar with filters
        url = f"/calendar/calendar#year={year}&month={month}&day={day}&view={view}&filters=participatory_step,meeting,external_event,debate"
        
        with self.catch_401(
            self.client.get,
            url,
            name=f"Decidim - Calendar: {view}",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Browsed calendar with view: {view}")
            else:
                response.failure(f"Calendar failed: {response.status_code}")

    @task(2)
    def browse_calendar_gantt(self):
        """
        Browse the calendar in Gantt view.
        Weight 2 - occasional action.
        Gantt view shows timeline of all participatory activities.
        """
        with self.catch_401(
            self.client.get,
            "/calendar/calendar/gantt",
            name="Decidim - Calendar Gantt",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Browsed calendar in Gantt view")
            else:
                response.failure(f"Calendar Gantt failed: {response.status_code}")

    @task(2)
    def browse_homepage(self):
        """
        Visit the Decidim homepage.
        Weight 2 - occasional action.
        """
        with self.catch_401(
            self.client.get,
            "/",
            name="Decidim - Homepage",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[decidim_user] Visited homepage")
            else:
                response.failure(f"Homepage failed: {response.status_code}")


