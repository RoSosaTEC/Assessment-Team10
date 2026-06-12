"""VerifyAI Research Assistant API entrypoint."""

import os
import sys


PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from factory import create_app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
