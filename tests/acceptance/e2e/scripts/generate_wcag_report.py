#!/usr/bin/env python3
"""
WCAG 2.0/2.1 AA Violations Report Generator
Extracts and analyzes only CRITICAL violations from accessibility scan JSON files
"""

import json
import os
from pathlib import Path
from collections import defaultdict

def analyze_violations(json_file):
    """Extract WCAG 2.0/2.1 AA violations from a single JSON file"""
    try:
        with open(json_file, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {json_file}: {e}")
        return None
    
    violations = data.get('violations', [])
    url = data.get('url', 'N/A')
    
    # Filter for WCAG 2.0/2.1 AA violations only
    critical_violations = []
    for violation in violations:
        tags = violation.get('tags', [])
        # Check if it's WCAG 2.0 or 2.1 AA (and not ONLY 2.2)
        is_wcag2aa = any(tag in tags for tag in ['wcag2aa', 'wcag21aa'])
        is_wcag22_only = 'wcag22aa' in tags and not is_wcag2aa
        
        if is_wcag2aa and not is_wcag22_only:
            critical_violations.append(violation)
    
    return {
        'url': url,
        'violations': critical_violations
    }

def format_violation_report(filename, violation_data):
    """Format a single violation for the report"""
    if not violation_data or not violation_data['violations']:
        return None
    
    report_lines = []
    report_lines.append(f"\n{'='*80}")
    report_lines.append(f"FILE: {filename}")
    report_lines.append(f"URL: {violation_data['url']}")
    report_lines.append(f"CRITICAL VIOLATIONS: {len(violation_data['violations'])}")
    report_lines.append(f"{'='*80}\n")
    
    for i, violation in enumerate(violation_data['violations'], 1):
        rule_id = violation.get('id', 'N/A')
        description = violation.get('description', 'N/A')
        impact = violation.get('impact', 'N/A').upper()
        help_url = violation.get('helpUrl', 'N/A')
        nodes = violation.get('nodes', [])
        
        report_lines.append(f"[VIOLATION #{i}]")
        report_lines.append(f"  Rule ID: {rule_id}")
        report_lines.append(f"  Description: {description}")
        report_lines.append(f"  Impact: {impact}")
        report_lines.append(f"  Elements Affected: {len(nodes)}")
        report_lines.append(f"  Help: {help_url}\n")
        
        # Extract element details - ALL elements
        for j, node in enumerate(nodes, 1):
            html = node.get('html', 'N/A')[:150]  # First 150 chars
            target = node.get('target', ['N/A'])[0] if node.get('target') else 'N/A'
            failure = node.get('failureSummary', 'N/A')
            
            report_lines.append(f"    Element {j}:")
            report_lines.append(f"      Selector: {target}")
            report_lines.append(f"      HTML: {html}...")
            report_lines.append(f"      Issue: {failure}\n")
    
    return '\n'.join(report_lines)

def main():
    # Point to a11y-reports directory (one level up)
    reports_dir = Path(__file__).parent.parent / 'a11y-reports'
    
    print("🔍 Scanning for WCAG 2.0/2.1 AA violations...")
    print(f"📁 Reports directory: {reports_dir}\n")
    
    json_files = sorted(reports_dir.glob('*__latest.json'))
    
    if not json_files:
        print("❌ No JSON files found in reports directory")
        return
    
    critical_count = 0
    report_content = []
    summary_stats = defaultdict(int)
    
    for json_file in json_files:
        filename = json_file.name
        violation_data = analyze_violations(json_file)
        
        if violation_data and violation_data['violations']:
            critical_count += len(violation_data['violations'])
            summary_stats[filename] = len(violation_data['violations'])
            
            formatted_report = format_violation_report(filename, violation_data)
            if formatted_report:
                report_content.append(formatted_report)
    
    # Generate summary
    summary = "\n" + "="*80 + "\n"
    summary += "📊 WCAG 2.0/2.1 AA VIOLATIONS SUMMARY\n"
    summary += "="*80 + "\n"
    summary += f"Total Files Scanned: {len(json_files)}\n"
    summary += f"Files with Critical Violations: {len(summary_stats)}\n"
    summary += f"Total Critical Violations: {critical_count}\n"
    summary += "="*80 + "\n\n"
    
    if summary_stats:
        summary += "FILES REQUIRING FIXES:\n"
        for filename, count in sorted(summary_stats.items(), key=lambda x: x[1], reverse=True):
            summary += f"  • {filename}: {count} violations\n"
    else:
        summary += "✅ NO CRITICAL VIOLATIONS FOUND!\n"
    
    # Write comprehensive report to file
    output_file = reports_dir / "WCAG_2.0_2.1_AA_VIOLATIONS_REPORT.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(summary)
        f.write('\n'.join(report_content))
    
    # Print summary to console
    print(summary)
    
    if report_content:
        print(f"✅ Detailed report saved to: {output_file}\n")
        print("⚠️ CRITICAL ISSUES DETECTED - Review the detailed report for fixes required\n")
    else:
        print(f"✅ No WCAG 2.0/2.1 AA critical violations found!\n")
        print(f"✅ Detailed report saved to: {output_file}\n")

if __name__ == '__main__':
    main()
