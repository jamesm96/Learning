# Runs learner code the same way on the phone (in a Web Worker) and at build
# time (in Node). Both load this file, so tracebacks look identical in both.

import json
import linecache
import os
import shutil
import sys
import traceback

WORK = "/home/pyodide/work"  # every run starts in a fresh copy of this folder


def _register_source(filename, code):
    # Let tracebacks show the source line, as real Python does for a file.
    linecache.cache[filename] = (len(code), None, code.splitlines(True), filename)


def _describe(error):
    # Format an exception like Python does, minus the frames of this harness.
    tb = error.__traceback__
    while tb is not None and tb.tb_frame.f_code.co_filename == __file__:
        tb = tb.tb_next
    text = "".join(traceback.format_exception(type(error), error, tb))
    return {"type": type(error).__name__, "message": str(error), "traceback": text}


def _fresh_folder(files):
    # Empty the working folder, write the sample files into it, and make it current.
    os.chdir("/home/pyodide")
    if os.path.isdir(WORK):
        shutil.rmtree(WORK)
    os.makedirs(WORK)
    for name, text in files.items():
        path = os.path.join(WORK, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
    os.chdir(WORK)


def run(code, check="", files_json="{}", filename="main.py"):
    """Run code in a fresh namespace and a fresh working folder, then optional hidden check code.

    Returns a dict: error is the learner's exception (or None); check_error is
    the check's exception (or None). Printed output is captured by the caller.
    """
    _fresh_folder(json.loads(files_json))
    namespace = {"__name__": "__main__"}
    _register_source(filename, code)
    try:
        exec(compile(code, filename, "exec"), namespace)
    except BaseException as error:  # report everything, including SystemExit
        return {"error": _describe(error), "check_error": None}
    finally:
        sys.stdout.flush()

    if check:
        _register_source("check.py", check)
        try:
            exec(compile(check, "check.py", "exec"), namespace)
        except BaseException as error:
            return {"error": None, "check_error": _describe(error)}
    return {"error": None, "check_error": None}
