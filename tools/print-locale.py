#!/usr/bin/env python3
"""Apply the site's local font/RTL presentation to worksheet print HTML."""
import sys
from locale_output import locale_output

if __name__ == '__main__':
    sys.stdout.write(locale_output(sys.stdin.read(), sys.argv[1]))
