interface StepProgressProps {
  steps: string[];
  current: number;
}

export default function StepProgress({ steps, current }: StepProgressProps) {
  return (
    <ol className="step-progress">
      {steps.map((step, index) => (
        <li key={step} className={index <= current ? 'active' : ''}>
          <span>{index + 1}</span>
          <strong>{step}</strong>
        </li>
      ))}
    </ol>
  );
}
