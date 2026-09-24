# Deploying

1. Merge to `main`. The pipeline builds and runs the tests.
2. Approve the staging step in the pipeline view.
3. Check the staging health page for ten minutes.
4. Approve the production step. Watch the error rate for one hour.

Roll back by re-running the previous production step.
