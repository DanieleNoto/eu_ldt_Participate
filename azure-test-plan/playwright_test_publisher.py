"""
SPDX-License-Identifier: AGPL-3.0
Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
Authors:
Gianfranco Cedro
"""
"""
Publish Playwright test results to Azure DevOps Test Plans.
Reads JUnit XML report and maps test cases to Azure Test Plans based on test names.

Expected test naming convention:
    [PROJECT-XXX] Test Description
    Where PROJECT-XXX is the Azure Test Case ID or Work Item ID

The script automatically:
- Searches for Work Items matching the test tag
- Aggregates all tests belonging to the same test suite
- Publishes detailed results with all individual test outcomes to Azure DevOps
"""

import os
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, List, Tuple
import requests
from requests.auth import HTTPBasicAuth


class PlaywrightTestPublisher:
    def __init__(self):
        self.token = os.getenv('SYSTEM_ACCESSTOKEN') or os.getenv('AUTO_TEST_DEVOPS_PAT')
        self.org = os.getenv('AZURE_DEVOPS_ORG', 'EULDT-Toolbox')
        self.project = os.getenv('AZURE_DEVOPS_PROJECT', 'EU LDT City Innovation Planner')
        
        if not self.token:
            raise ValueError("Neither SYSTEM_ACCESSTOKEN nor AUTO_TEST_DEVOPS_PAT found. Enable 'Allow scripts to access the OAuth token' in pipeline settings.")
        
        self.base_url = f"https://dev.azure.com/{self.org}/{self.project}/_apis"
        self.auth = HTTPBasicAuth("", self.token)
        self.headers = {'Content-Type': 'application/json'}
    
    def parse_junit_xml(self, xml_file: str) -> List[Dict]:
        """Parse JUnit XML and extract test results"""
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()
        except FileNotFoundError:
            print(f"JUnit XML file not found: {xml_file}")
            return []
        except ET.ParseError as e:
            print(f"Error parsing JUnit XML: {e}")
            return []
        
        test_results = []
        
        for testsuite in root.findall('.//testsuite'):
            suite_name = testsuite.get('name', '')
            
            for testcase in testsuite.findall('testcase'):
                test_name = testcase.get('name', '')
                classname = testcase.get('classname', '')
                time = float(testcase.get('time', 0))
                
                failure = testcase.find('failure')
                error = testcase.find('error')
                skipped = testcase.find('skipped')
                
                if skipped is not None:
                    outcome = 'NotExecuted'
                    error_message = skipped.get('message', 'Test skipped')
                elif failure is not None:
                    outcome = 'Failed'
                    error_message = failure.get('message', 'Test failed')
                    if failure.text:
                        error_message += f"\n{failure.text[:500]}"
                elif error is not None:
                    outcome = 'Failed'
                    error_message = error.get('message', 'Test error')
                    if error.text:
                        error_message += f"\n{error.text[:500]}"
                else:
                    outcome = 'Passed'
                    error_message = None
                
                test_case_id = self._extract_test_case_id(test_name)
                
                test_results.append({
                    'name': test_name,
                    'classname': classname,
                    'suite': suite_name,
                    'duration': time * 1000,
                    'outcome': outcome,
                    'error_message': error_message,
                    'test_case_id': test_case_id
                })
        
        return test_results
    
    def _extract_test_case_id(self, test_name: str) -> str:
        """
        Extract test case Work Item ID from test name.
        Supports formats: 
        - [CIP-XXX] Title (ID: 11473) - extracts 11473
        - [CIP-XXX] - extracts CIP-XXX
        """
        id_match = re.search(r'\(ID:\s*(\d+)\)', test_name)
        if id_match:
            return id_match.group(1)
        
        match = re.search(r'\[([A-Z]+-[A-Z0-9]+|\w+)\]', test_name)
        if match:
            return match.group(1)
        return None
    
    def find_work_item_by_tag(self, tag: str) -> str:
        """Find Work Item ID by searching for exact tag match in title
        Tag format: [CIP-XXX] matches Test Case with title exactly 'CIP-XXX'
        Example: [CIP-APC01] → finds Test Case titled 'CIP-APC01' (Work Item ID: 11407)
        """
        try:
            wiql_url = f"{self.base_url}/wit/wiql"
            clean_tag = tag.replace('[', '').replace(']', '')
            query = {
                "query": f"SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'Test Case' AND [System.Title] = '{clean_tag}' AND [System.TeamProject] = '{self.project}'"
            }
            
            print(f"  WIQL Query: {query['query']}")
            
            response = requests.post(
                wiql_url,
                auth=self.auth,
                headers=self.headers,
                json=query,
                params={'api-version': '7.0'}
            )
            
            if response.status_code == 200:
                results = response.json().get('workItems', [])
                if results:
                    work_item_id = str(results[0]['id'])
                    print(f"  Found Work Item ID: {work_item_id} for tag '{clean_tag}'")
                    return work_item_id
                else:
                    print(f"  No Test Case found with exact title '{clean_tag}'")
            else:
                print(f"  WIQL query failed: {response.status_code} - {response.text}")
            
            return None
        except Exception as e:
            print(f"Error searching for work item with tag {tag}: {e}")
            return None
    
    def get_test_plans_for_test_case(self, test_case_id: str) -> List[Tuple[int, int, int]]:
        """
        Find all test plans containing this test case.
        Returns list of (plan_id, suite_id, point_id) tuples
        """
        try:
            plans_url = f"{self.base_url}/testplan/plans"
            print(f"  Fetching test plans from: {plans_url}")
            response = requests.get(
                plans_url,
                auth=self.auth,
                params={'api-version': '7.0'}
            )
            
            if response.status_code != 200:
                print(f"  Failed to get test plans: {response.status_code}")
                return []
            
            plans = response.json().get('value', [])
            print(f"  Found {len(plans)} test plan(s)")
            test_points = []
            
            for plan in plans:
                plan_id = plan['id']
                plan_name = plan.get('name', 'Unknown')
                print(f"  Checking Plan {plan_id}: {plan_name}")
                
                suites_url = f"{self.base_url}/test/plans/{plan_id}/suites"
                suites_response = requests.get(
                    suites_url,
                    auth=self.auth,
                    params={'api-version': '5.0'}
                )
                
                if suites_response.status_code == 200:
                    suites = suites_response.json().get('value', [])
                    print(f"    Found {len(suites)} suite(s) in plan {plan_id}")
                    
                    for suite in suites:
                        suite_id = suite['id']
                        suite_name = suite.get('name', 'Unknown')
                        
                        points_url = f"{self.base_url}/test/plans/{plan_id}/suites/{suite_id}/points"
                        points_response = requests.get(
                            points_url,
                            auth=self.auth,
                            params={'api-version': '5.0'}
                        )
                        
                        if points_response.status_code == 200:
                            points = points_response.json().get('value', [])
                            print(f"      Suite {suite_id} ({suite_name}): {len(points)} test point(s)")
                            
                            for point in points:
                                tc = point.get('testCase', {})
                                point_id = point.get('id')
                                tc_id = str(tc.get('id', ''))
                                tc_name = tc.get('name', 'Unknown')
                                
                                print(f"        Point {point_id}: Test Case {tc_id} ({tc_name})")
                                
                                if tc_id == str(test_case_id):
                                    print(f"        ✓ MATCH! Found test case {test_case_id} at point {point_id}")
                                    test_points.append((plan_id, suite_id, point_id))
                        else:
                            print(f"      Failed to get points for suite {suite_id}: {points_response.status_code}")
                else:
                    print(f"    Failed to get suites for plan {plan_id}: {suites_response.status_code}")
            
            print(f"  Total test points found for test case {test_case_id}: {len(test_points)}")
            return test_points
        
        except Exception as e:
            print(f"Error finding test plans for test case {test_case_id}: {e}")
            import traceback
            traceback.print_exc()
            return []
        """Get test point IDs for a test case in a test plan"""
        try:
            url = f"{self.base_url}/test/plans/{test_plan_id}/suites"
            response = requests.get(url, auth=self.auth, params={'api-version': '7.0'})
            
            if response.status_code != 200:
                print(f"Failed to get test suites: {response.status_code}")
                return []
            
            suites = response.json().get('value', [])
            test_point_ids = []
            
            for suite in suites:
                suite_id = suite['id']
                points_url = f"{self.base_url}/test/plans/{test_plan_id}/suites/{suite_id}/points"
                points_response = requests.get(
                    points_url,
                    auth=self.auth,
                    params={'api-version': '7.0'}
                )
                
                if points_response.status_code == 200:
                    points = points_response.json().get('value', [])
                    for point in points:
                        tc = point.get('testCase', {})
                        if (tc.get('id') == test_case_id or 
                            test_case_id in tc.get('name', '')):
                            test_point_ids.append(point['id'])
            
            return test_point_ids
        
        except Exception as e:
            print(f"Error getting test points for {test_case_id}: {e}")
            return []
    
    def create_test_run(self, test_plan_id: int, run_name: str, point_ids: List[int]) -> int:
        """Create a new test run"""
        url = f"{self.base_url}/test/runs"
        
        payload = {
            "name": run_name,
            "plan": {"id": str(test_plan_id)},
            "pointIds": point_ids,
            "automated": True
        }
        
        try:
            response = requests.post(
                url,
                auth=self.auth,
                headers=self.headers,
                json=payload,
                params={'api-version': '7.0'}
            )
            
            if response.status_code in [200, 201]:
                run_id = response.json().get('id')
                print(f"Created test run {run_id}: {run_name}")
                return run_id
            else:
                print(f"Failed to create test run: {response.status_code} - {response.text}")
                return None
        
        except Exception as e:
            print(f"Error creating test run: {e}")
            return None
    
    def update_test_results(self, run_id: int, results: List[Dict]) -> bool:
        """Update test results in a test run with aggregated suite data"""
        get_results_url = f"{self.base_url}/test/runs/{run_id}/results"
        
        try:
            response = requests.get(
                get_results_url,
                auth=self.auth,
                params={'api-version': '7.0'}
            )
            
            if response.status_code != 200:
                print(f"Failed to get test results from run: {response.status_code}")
                return False
            
            run_results = response.json().get('value', [])
            
            point_to_result = {}
            for run_result in run_results:
                test_point = run_result.get('testPoint', {})
                point_id = test_point.get('id')
                result_id = run_result.get('id')
                if point_id and result_id:
                    point_to_result[str(point_id)] = result_id
            
            print(f"  Mapped {len(point_to_result)} test points to result IDs")
            
            url = f"{self.base_url}/test/runs/{run_id}/results"
            
            formatted_results = []
            for suite_data in results:
                comment = self._format_suite_comment(suite_data)
                
                error_message = comment
                
                point_id = str(suite_data.get('test_point_id'))
                result_id = point_to_result.get(point_id)
                
                if not result_id:
                    print(f"  Warning: No result ID found for test point {point_id}")
                    continue
                
                formatted_results.append({
                    "id": result_id,
                    "outcome": suite_data['overall_outcome'],
                    "state": "Completed",
                    "durationInMs": suite_data['duration'],
                    "errorMessage": error_message,
                    "comment": comment
                })
            
            response = requests.patch(
                url,
                auth=self.auth,
                headers=self.headers,
                json=formatted_results,
                params={'api-version': '7.0'}
            )
            
            if response.status_code in [200, 201]:
                print(f"Updated {len(formatted_results)} test results in run {run_id}")
                return True
            else:
                print(f"Failed to update results: {response.status_code} - {response.text}")
                return False
        
        except Exception as e:
            print(f"Error updating test results: {e}")
            return False
    
    def _aggregate_suite_results(self, test_results: List[Dict]) -> Dict[str, Dict]:
        """
        Aggregate test results by test case ID (suite).
        Groups all tests belonging to the same [CIP-XXX] suite together.
        
        Returns: {test_case_id: {
            'suite_name': str,
            'overall_outcome': str,
            'total_tests': int,
            'passed': int,
            'failed': int,
            'skipped': int,
            'duration': float,
            'tests': List[Dict]
        }}
        """
        aggregated = {}
        
        for result in test_results:
            test_case_id = result.get('test_case_id')
            if not test_case_id:
                continue
            
            if test_case_id not in aggregated:
                aggregated[test_case_id] = {
                    'suite_name': result.get('suite', ''),
                    'overall_outcome': 'Passed',
                    'total_tests': 0,
                    'passed': 0,
                    'failed': 0,
                    'skipped': 0,
                    'duration': 0,
                    'tests': []
                }
            
            suite_data = aggregated[test_case_id]
            suite_data['total_tests'] += 1
            suite_data['duration'] += result.get('duration', 0)
            suite_data['tests'].append(result)
            
            outcome = result.get('outcome', 'Passed')
            if outcome == 'Passed':
                suite_data['passed'] += 1
            elif outcome == 'Failed':
                suite_data['failed'] += 1
                suite_data['overall_outcome'] = 'Failed'
            elif outcome == 'NotExecuted':
                suite_data['skipped'] += 1
        
        return aggregated
    
    def _format_suite_comment(self, suite_data: Dict) -> str:
        """Format a detailed comment for suite test results"""
        lines = [
            "Automated test result from Playwright",
            f"Suite: {suite_data['suite_name']}",
            f"Total: {suite_data['total_tests']} tests - "
            f"{suite_data['passed']} passed, {suite_data['failed']} failed, {suite_data['skipped']} skipped",
            ""
        ]
        
        if suite_data['failed'] > 0:
            lines.append("Failed tests:")
            for test in suite_data['tests']:
                if test['outcome'] == 'Failed':
                    lines.append(f"❌ {test['name']}")
                    if test.get('error_message'):
                        full_error = test['error_message'][:1000]
                        lines.append(f"   Error: {full_error}")
                        lines.append("")
            lines.append("")
        
        if suite_data['passed'] > 0:
            lines.append("Passed tests:")
            for test in suite_data['tests']:
                if test['outcome'] == 'Passed':
                    lines.append(f"✅ {test['name']}")
        
        return "\n".join(lines)
    
    def publish_results(self, junit_xml_path: str) -> bool:
        """Main method to publish test results with automatic Test Plan discovery"""
        print(f"Reading test results from: {junit_xml_path}")
        
        test_results = self.parse_junit_xml(junit_xml_path)
        
        if not test_results:
            print("No test results found in JUnit XML")
            return False
        
        print(f"Found {len(test_results)} test results")
        
        aggregated_results = self._aggregate_suite_results(test_results)
        print(f"Aggregated into {len(aggregated_results)} test suite(s)")
        
        results_by_plan = {}
        
        for test_case_id, suite_data in aggregated_results.items():
            
            if not test_case_id.isdigit():
                print(f"Searching for Work Item with tag [{test_case_id}]...")
                work_item_id = self.find_work_item_by_tag(test_case_id)
                if work_item_id:
                    print(f"  Found Work Item ID: {work_item_id}")
                    test_case_id = work_item_id
                else:
                    print(f" No Work Item found for tag [{test_case_id}]")
                    continue
            
            test_points = self.get_test_plans_for_test_case(test_case_id)
            
            if not test_points:
                print(f"No test points found for test case {test_case_id}")
                continue
            
            for plan_id, suite_id, point_id in test_points:
                if plan_id not in results_by_plan:
                    results_by_plan[plan_id] = []
                
                suite_data_copy = suite_data.copy()
                suite_data_copy['test_point_id'] = point_id
                suite_data_copy['suite_id'] = suite_id
                suite_data_copy['test_case_id'] = test_case_id
                results_by_plan[plan_id].append((point_id, suite_data_copy))
        
        if not results_by_plan:
            print("\nNo test results could be mapped to Azure Test Plans")
            print("Test results summary:")
            for result in test_results:
                status_icon = "PASSED" if result['outcome'] == 'Passed' else "FAILED"
                print(f"  {status_icon} {result['name']} - {result['outcome']}")
            return True
        
        print(f"\nPublishing to {len(results_by_plan)} Test Plan(s)...")
        
        all_success = True
        for plan_id, results in results_by_plan.items():
            run_name = f"Playwright Tests - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            point_ids = [point_id for point_id, _ in results]
            results_list = [r for _, r in results]
            
            print(f"\n  Test Plan {plan_id}: {len(results_list)} test(s)")
            
            run_id = self.create_test_run(plan_id, run_name, point_ids)
            
            if run_id:
                success = self.update_test_results(run_id, results_list)
                if success:
                    print(f"Published to run {run_id}")
                else:
                    print(f"Failed to update results")
                    all_success = False
            else:
                print(f"Failed to create run")
                all_success = False
        
        return all_success


if __name__ == "__main__":
    junit_xml_path = "tests/acceptance/e2e/playwright-report/results-junit.xml"
    
    if len(sys.argv) > 1:
        junit_xml_path = sys.argv[1]
    
    try:
        publisher = PlaywrightTestPublisher()
        success = publisher.publish_results(junit_xml_path)
        sys.exit(0 if success else 1)
    
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
