workflow "New workflow" {
  on = "push"
  resolves = ["Run tests"]
}

action "Run tests" {
  uses = "actions/docker/cli@76ff57a6c3d817840574a98950b0c7bc4e8a13a8"
  args = "build ."
}
