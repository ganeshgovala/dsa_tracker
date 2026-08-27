import type { Difficulty } from "./types";
import type { LangId } from "./judge";

export interface JudgeTest {
  /** Raw stdin for a single case (the harness feeds many of these at once). */
  input: string;
  /** Expected single-line output for this case. */
  expected: string;
}

export interface PlaygroundExample {
  input: string;
  output: string;
  explanation?: string;
}

/** Code we prepend/append around the user's method to read all cases at once. */
export interface Harness {
  header: string;
  footer: string;
}

export interface PlaygroundProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  description: string[];
  /** One-line reminder of what to implement. */
  task: string;
  examples: PlaygroundExample[];
  constraints: string[];
  /** Method-only starter the user edits (a correct solution, so tests pass). */
  starter: Record<LangId, string>;
  /** Driver that reads T cases and prints one line per case. */
  harness: Record<LangId, Harness>;
  tests: JudgeTest[];
}

const twoSum: PlaygroundProblem = {
  id: "two-sum",
  title: "Two Sum",
  difficulty: "Easy",
  topic: "Arrays & Hashing",
  task: "Return the indices of the two numbers that add up to `target`.",
  description: [
    "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.",
    "You may assume each input has exactly one solution, and you may not use the same element twice. The answer can be returned in any order.",
  ],
  examples: [
    {
      input: "2 7 11 15\n9",
      output: "0 1",
      explanation: "nums[0] + nums[1] = 2 + 7 = 9, so we return 0 1.",
    },
    { input: "3 2 4\n6", output: "1 2" },
  ],
  constraints: [
    "2 ≤ nums.length ≤ 10^4",
    "-10^9 ≤ nums[i] ≤ 10^9",
    "Exactly one valid answer exists.",
  ],
  starter: {
    python: `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return seen[target - x], i
        seen[x] = i
    return -1, -1
`,
    javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];
    seen.set(nums[i], i);
  }
  return [-1, -1];
}
`,
    cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        if (seen.count(target - nums[i]))
            return { seen[target - nums[i]], i };
        seen[nums[i]] = i;
    }
    return { -1, -1 };
}
`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (seen.containsKey(target - nums[i]))
                return new int[]{ seen.get(target - nums[i]), i };
            seen.put(nums[i], i);
        }
        return new int[]{ -1, -1 };
    }
}
`,
  },
  harness: {
    python: {
      header: "",
      footer: `
import sys

def _run():
    _data = sys.stdin.read().split("\\n")
    _i = 0
    _t = int(_data[_i]); _i += 1
    _out = []
    for _ in range(_t):
        nums = list(map(int, _data[_i].split())); _i += 1
        target = int(_data[_i].strip()); _i += 1
        a, b = two_sum(nums, target)
        _out.append(str(a) + " " + str(b))
    sys.stdout.write("\\n".join(_out))

_run()
`,
    },
    javascript: {
      header: "",
      footer: `
(function () {
    const _lines = require("fs").readFileSync(0, "utf8").split("\\n");
    let _i = 0;
    const _t = parseInt(_lines[_i++], 10);
    const _out = [];
    for (let _c = 0; _c < _t; _c++) {
        const nums = _lines[_i++].trim().split(/\\s+/).map(Number);
        const target = parseInt(_lines[_i++], 10);
        const r = twoSum(nums, target);
        _out.push(r[0] + " " + r[1]);
    }
    console.log(_out.join("\\n"));
})();
`,
    },
    cpp: {
      header: `#include <bits/stdc++.h>
using namespace std;

`,
      footer: `
int main() {
    int T;
    string line;
    getline(cin, line);
    T = stoi(line);
    string out;
    for (int c = 0; c < T; c++) {
        getline(cin, line);
        stringstream ss(line);
        vector<int> nums; int x;
        while (ss >> x) nums.push_back(x);
        getline(cin, line);
        int target = stoi(line);
        vector<int> r = twoSum(nums, target);
        out += to_string(r[0]) + " " + to_string(r[1]) + "\\n";
    }
    cout << out;
    return 0;
}
`,
    },
    java: {
      header: `import java.util.*;

`,
      footer: `
class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int T = Integer.parseInt(sc.nextLine().trim());
        Solution sol = new Solution();
        StringBuilder sb = new StringBuilder();
        for (int c = 0; c < T; c++) {
            int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+"))
                               .mapToInt(Integer::parseInt).toArray();
            int target = Integer.parseInt(sc.nextLine().trim());
            int[] r = sol.twoSum(nums, target);
            sb.append(r[0]).append(" ").append(r[1]).append(System.lineSeparator());
        }
        System.out.print(sb);
    }
}
`,
    },
  },
  tests: [
    { input: "2 7 11 15\n9", expected: "0 1" },
    { input: "3 2 4\n6", expected: "1 2" },
    { input: "3 3\n6", expected: "0 1" },
    { input: "-3 4 3 90\n0", expected: "0 2" },
    { input: "1 2 3 4 5 6 7 8 9 10\n19", expected: "8 9" },
  ],
};

export const playgroundProblems: PlaygroundProblem[] = [twoSum];

export function getPlaygroundProblem(id?: string): PlaygroundProblem {
  return playgroundProblems.find((p) => p.id === id) ?? playgroundProblems[0];
}

/** Wrap the user's method with the language harness into a full program. */
export function assembleSource(
  problem: PlaygroundProblem,
  lang: LangId,
  userCode: string,
): string {
  const h = problem.harness[lang];
  return `${h.header}${userCode}\n${h.footer}`;
}

/** Pack every test case into one stdin payload: `T` then each case. */
export function buildBatchStdin(tests: JudgeTest[]): string {
  return `${tests.length}\n${tests.map((t) => t.input).join("\n")}\n`;
}
