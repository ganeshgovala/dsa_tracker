import { Playground } from "@/components/playground/playground";
import { getPlaygroundProblem } from "@/lib/playground-problems";

export default function PlaygroundPage() {
  const problem = getPlaygroundProblem();
  return <Playground problem={problem} />;
}
