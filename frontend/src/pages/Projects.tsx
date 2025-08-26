import { Link } from 'react-router-dom';

export default function Projects() {
  const projects = [{ id: 1, name: 'Demo Project' }];
  return (
    <div style={{ padding: 16 }}>
      <h2>Projects</h2>
      <ul>
        {projects.map(p => (
          <li key={p.id}>
            <Link to={`/projects/${p.id}/board`}>{p.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
