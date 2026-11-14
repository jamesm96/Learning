# Runs learner code the same way on the phone (in a Web Worker) and at build
# time (in Node). Both load this file, so tracebacks look identical in both.

import linecache
import sys
import traceback


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


def run(code, check="", filename="main.py"):
    """Run code in a fresh namespace, then optional hidden check code in the same namespace.

    Returns a dict: error is the learner's exception (or None); check_error is
    the check's exception (or None). Printed output is captured by the caller.
    """
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
