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


class DecidimInteractiveUser(AuthenticatedUser):
    """
    Simulates interactive users performing intensive read operations on Decidim.
    Tests complex queries, filters, sorting, and pagination that stress the backend.
    
    Realistic mix: 70% intensive reads + 30% standard navigation.
    """
    
    # Wait time between tasks (seconds) - slightly lower for more active users
    wait_time = between(1, 3)
    
    # Real process slugs from the test environment
    processes = [
        "test",
    ]
    
    # Real assembly slugs from the test environment
    assemblies = [
        "test-mtt",
    ]
    
    # Real component IDs for 'test' process
    test_components = {
        "proposals": (51, 2),
        "debates": (3, 1),
        "meetings": (6, 5),
    }
    
    # Search terms for testing search functionality
    search_terms = [
        "test",
        "proposal",
        "meeting",
        "debate",
        "process",
    ]
    
    # Proposal sorting options (most intensive queries)
    proposal_orders = [
        "recent",           # ORDER BY created_at DESC
        "most_commented",   # JOIN comments + COUNT + ORDER BY
        "most_endorsed",    # JOIN endorsements + COUNT + ORDER BY
        "most_followed",    # JOIN follows + COUNT + ORDER BY
        "most_voted",       # JOIN votes + COUNT + ORDER BY
        "random",           # RANDOM() - very intensive
    ]
    
    # Proposal state filters
    proposal_states = [
        "accepted",
        "rejected",
        "evaluating",
        "withdrawn",
        "all",
    ]

    # ========================================
    # INTENSIVE READ OPERATIONS (70%)
    # ========================================

    @task(12)
    def global_search(self):
        """
        Perform global search across all content.
        High weight (12) - VERY intensive: full-text search on multiple tables.
        Searches proposals, debates, meetings, processes, users, comments, etc.
        Most stressful operation for the database.
        """
        search_term = random.choice(self.search_terms)
        
        with self.catch_401(
            self.client.get,
            f"/search?term={search_term}",
            name="Decidim - Global Search",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Performed global search: {search_term}")
            else:
                response.failure(f"Global search failed: {response.status_code}")

    @task(15)
    def browse_proposals_with_sorting(self):
        """
        Browse proposals with different sorting orders.
        High weight (15) - tests JOIN + COUNT + ORDER BY queries.
        Very intensive for database.
        """
        process = "test"
        component_id = self.test_components["proposals"][0]
        order = random.choice(self.proposal_orders)
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}/f/{component_id}/proposals?order={order}",
            name=f"Decidim - Proposals Sorted: {order}",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Browsed proposals with order: {order}")
            elif response.status_code == 404:
                print(f"[interactive_user] Proposals with order {order} not found")
            else:
                response.failure(f"Sorted proposals failed: {response.status_code}")

    @task(12)
    def browse_proposals_with_filters(self):
        """
        Browse proposals with state filters.
        Weight 12 - tests WHERE clauses with complex conditions.
        """
        process = "test"
        component_id = self.test_components["proposals"][0]
        state = random.choice(self.proposal_states)
        
        filter_param = f"filter[state]={state}" if state != "all" else ""
        url = f"/processes/{process}/f/{component_id}/proposals?{filter_param}"
        
        with self.catch_401(
            self.client.get,
            url,
            name=f"Decidim - Proposals Filtered: {state}",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Filtered proposals by state: {state}")
            else:
                response.failure(f"Filtered proposals failed: {response.status_code}")

    @task(10)
    def browse_proposals_with_pagination(self):
        """
        Navigate through proposal pages.
        Weight 10 - tests OFFSET/LIMIT queries and pagination logic.
        """
        process = "test"
        component_id = self.test_components["proposals"][0]
        page = random.randint(1, 5)  # Simulate browsing first 5 pages
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}/f/{component_id}/proposals?page={page}",
            name="Decidim - Proposals Paginated",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Browsed proposals page {page}")
            else:
                response.failure(f"Paginated proposals failed: {response.status_code}")

    @task(8)
    def browse_proposals_complex_query(self):
        """
        Combine filters, sorting, and pagination.
        Weight 8 - most intensive query: WHERE + JOIN + COUNT + ORDER + LIMIT.
        Stresses database with complex query plans.
        """
        process = "test"
        component_id = self.test_components["proposals"][0]
        order = random.choice(self.proposal_orders)
        state = random.choice([s for s in self.proposal_states if s != "all"])
        page = random.randint(1, 3)
        
        url = f"/processes/{process}/f/{component_id}/proposals?order={order}&filter[state]={state}&page={page}"
        
        with self.catch_401(
            self.client.get,
            url,
            name="Decidim - Proposals Complex Query",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Complex query: order={order}, state={state}, page={page}")
            else:
                response.failure(f"Complex query failed: {response.status_code}")

    @task(7)
    def view_proposal_with_comments(self):
        """
        View proposal detail page (includes comments, endorsements, votes).
        Weight 7 - loads related data: comments + users + endorsements + votes.
        Multiple JOIN queries executed.
        """
        process = "test"
        component_id, proposal_id = self.test_components["proposals"]
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}/f/{component_id}/proposals/{proposal_id}",
            name="Decidim - Proposal Detail (with relations)",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Viewed proposal {proposal_id} with all relations")
            else:
                response.failure(f"Proposal detail failed: {response.status_code}")

    @task(6)
    def browse_debates_with_sorting(self):
        """
        Browse debates with sorting.
        Weight 6 - similar to proposals but less frequent.
        """
        process = "test"
        component_id = self.test_components["debates"][0]
        order = random.choice(["recent", "most_commented"])
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}/f/{component_id}/debates?order={order}",
            name=f"Decidim - Debates Sorted: {order}",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Browsed debates with order: {order}")
            else:
                response.failure(f"Sorted debates failed: {response.status_code}")

    @task(5)
    def browse_meetings_with_filters(self):
        """
        Browse meetings with date filters.
        Weight 5 - tests datetime queries and filtering.
        """
        process = "test"
        component_id = self.test_components["meetings"][0]
        filter_type = random.choice(["upcoming", "past", "all"])
        
        filter_param = f"filter[date]={filter_type}" if filter_type != "all" else ""
        url = f"/processes/{process}/f/{component_id}/meetings?{filter_param}"
        
        with self.catch_401(
            self.client.get,
            url,
            name=f"Decidim - Meetings Filtered: {filter_type}",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Filtered meetings: {filter_type}")
            else:
                response.failure(f"Filtered meetings failed: {response.status_code}")

    # ========================================
    # STANDARD NAVIGATION (30%)
    # ========================================

    @task(8)
    def browse_processes_list(self):
        """
        Navigate to processes list.
        Weight 8 - common entry point.
        """
        with self.catch_401(
            self.client.get,
            "/processes",
            name="Decidim - Process List",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Browsed process list")
            else:
                response.failure(f"Process list failed: {response.status_code}")

    @task(6)
    def view_process_detail(self):
        """
        View process detail page.
        Weight 6 - common navigation.
        """
        process = random.choice(self.processes)
        
        with self.catch_401(
            self.client.get,
            f"/processes/{process}",
            name="Decidim - Process Detail",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Viewed process: {process}")
            else:
                response.failure(f"Process detail failed: {response.status_code}")

    @task(4)
    def view_debate_detail(self):
        """
        View debate detail.
        Weight 4 - occasional action.
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
                print(f"[interactive_user] Viewed debate {debate_id}")
            else:
                response.failure(f"Debate detail failed: {response.status_code}")

    @task(3)
    def view_meeting_detail(self):
        """
        View meeting detail.
        Weight 3 - occasional action.
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
                print(f"[interactive_user] Viewed meeting {meeting_id}")
            else:
                response.failure(f"Meeting detail failed: {response.status_code}")

    @task(5)
    def browse_assemblies_list(self):
        """
        Navigate to assemblies list.
        Weight 5 - assemblies are important participatory spaces.
        """
        with self.catch_401(
            self.client.get,
            "/assemblies",
            name="Decidim - Assemblies List",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Browsed assemblies list")
            else:
                response.failure(f"Assemblies list failed: {response.status_code}")

    @task(4)
    def view_assembly_detail(self):
        """
        View assembly detail page.
        Weight 4 - common navigation.
        """
        assembly = random.choice(self.assemblies)
        
        with self.catch_401(
            self.client.get,
            f"/assemblies/{assembly}",
            name="Decidim - Assembly Detail",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Viewed assembly: {assembly}")
            else:
                response.failure(f"Assembly detail failed: {response.status_code}")

    @task(4)
    def browse_calendar(self):
        """
        Browse the calendar with different views and filters.
        Weight 4 - common navigation action.
        Tests query performance with date ranges and filters.
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
                print(f"[interactive_user] Browsed calendar with view: {view}")
            else:
                response.failure(f"Calendar failed: {response.status_code}")

    @task(3)
    def browse_calendar_gantt(self):
        """
        Browse the calendar in Gantt view.
        Weight 3 - moderate frequency.
        Gantt view requires complex timeline queries across all participatory spaces.
        Tests database performance with date range queries and aggregations.
        """
        with self.catch_401(
            self.client.get,
            "/calendar/calendar/gantt",
            name="Decidim - Calendar Gantt",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Browsed calendar in Gantt view")
            else:
                response.failure(f"Calendar Gantt failed: {response.status_code}")

    @task(2)
    def browse_homepage(self):
        """
        Visit homepage.
        Weight 2 - occasional navigation.
        """
        with self.catch_401(
            self.client.get,
            "/",
            name="Decidim - Homepage",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                print(f"[interactive_user] Visited homepage")
            else:
                response.failure(f"Homepage failed: {response.status_code}")
