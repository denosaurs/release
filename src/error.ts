const causes = {
  GIT_EXE: "non-zero status returned by a git command",
  NO_REPO: "not a valid git repository",
  UNINITIALIZED_REPO: "repo is not initialized",
  PLUGIN: "plugin error",
};

export class ReleaseError extends Error {
  code: string;
  cause: string;
  constructor(code: keyof typeof causes, message?: string) {
    super(message ?? causes[code]);
    this.code = code;
    this.cause = causes[code];
  }
}
