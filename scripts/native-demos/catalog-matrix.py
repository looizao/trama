#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Reproducible sequential catalog compatibility matrix using retained live inputs."""
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
version='trama-surface-styles-v1'
for candidate in ['blender-mpfb','makehuman','flame']:
    subprocess.run([sys.executable,str(ROOT/'scripts/native-demos/verify-expanded-catalog.py'),candidate],check=True)
for upstream in ['makehuman','blender-mpfb','flame']:
    for candidate in ['open3d','meshlab','cloudcompare']:
        command=[sys.executable,'-u',str(ROOT/'scripts/native-demos/populate-components.py'),candidate,'--upstream',upstream,'--source-catalog-version',version]
        if upstream=='makehuman': command+=['--source-style-version','makehuman-visible-lips-v2']
        if candidate=='cloudcompare':command+=['--reference','blender-mpfb' if upstream=='makehuman' else 'makehuman']
        subprocess.run(command,check=True)
        subprocess.run([sys.executable,'-u',str(ROOT/'scripts/native-demos/verify-expanded-catalog.py'),candidate,'--upstream',upstream],check=True)
