"""Step registry used by the CLI and the web server."""
from . import collect, clean, extract, resolve, validate, load

STEPS = {"collect": collect.run, "clean": clean.run, "extract": extract.run,
         "resolve": resolve.run, "validate": validate.run, "load": load.run}
ORDER = list(STEPS)


def run_step(input_id, step):
    return STEPS[step](input_id)


def run_until(input_id, step):
    out = None
    for s in ORDER[: ORDER.index(step) + 1]:
        out = run_step(input_id, s)
    return out
