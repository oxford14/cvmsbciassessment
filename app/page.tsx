import { Header } from './components/Header';
import { AssessmentForm } from './components/AssessmentForm';

export default function HomePage() {
  return (
    <>
      <Header title="Church Assessment System" />
      <div className="container">
        <div className="card">
          <div className="form-header">
            <h2>Church Assessment Form</h2>
            <p>Please complete this form to record messenger attendance for your association</p>
          </div>
          <AssessmentForm />
        </div>
      </div>
    </>
  );
}
