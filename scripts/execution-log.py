#!/usr/bin/env python3
"""Update the requested portable HTML execution log, with one active task."""
import argparse
import datetime
import json
from pathlib import Path
from zoneinfo import ZoneInfo

parser = argparse.ArgumentParser()
parser.add_argument('task')
parser.add_argument('--status', choices=['pending', 'in progress', 'verified', 'blocked', 'failed'])
for field in ['event', 'change', 'limitation', 'verify', 'picture', 'commit', 'output']:
    parser.add_argument('--' + field, action='append', default=[])
parser.add_argument('--clear-limitations', action='store_true')
args = parser.parse_args()
path = Path(__file__).resolve().parent.parent / '.scratch/execution-log/assets/tasks.js'
assignment, separator, payload = path.read_text().partition('=')
if assignment.strip() != 'window.executionLog' or not separator:
    parser.error('Unexpected execution log data format.')
data = json.loads(payload.strip().removesuffix(';'))
task = next(t for t in data['tasks'] if t['id'] == args.task)
if args.status == 'in progress' and any(t['status'] == 'in progress' and t != task for t in data['tasks']):
    parser.error('Finish or block the current task before advancing.')
date = datetime.datetime.now(ZoneInfo('America/Sao_Paulo')).isoformat(timespec='seconds')
data['updated'] = date
if args.status:
    task['status'] = args.status
if args.clear_limitations:
    task['limitations'] = []
task['changes'] += args.change
task['limitations'] += args.limitation
task['commits'] += args.commit
task['events'] += [dict(date=date, text=e) for e in args.event]
for value in args.verify:
    command, result = value.split('|', 1)
    task['verification'].append(dict(command=command, result=result))
for value in args.picture:
    src, caption = value.split('|', 1)
    task['pictures'].append(dict(src=src, caption=caption, date=date))
for value in args.output:
    href, label = value.split('|', 1)
    task['outputs'].append(dict(href=href, label=label))
path.write_text('window.executionLog=' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')
