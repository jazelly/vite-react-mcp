import { Route, Routes } from 'react-router-dom';

const teamMembers = [
  ['Mira Chen', 'Design systems'],
  ['Owen Park', 'Federation runtime'],
  ['Sam Rivera', 'Component inspection'],
];

function ProfileMemberCard({
  focus,
  name,
}: {
  focus: string;
  name: string;
}) {
  const memberId = name.toLowerCase().replace(/\s+/g, '-');

  return (
    <article id={`profile-member-${memberId}`}>
      <strong>{name}</strong>
      <span>{focus}</span>
    </article>
  );
}

function ProfileIndex() {
  return (
    <section className="profile-panel" id="profile-remote">
      <p className="section-label">Profile remote</p>
      <h2>Federated team profile routes.</h2>
      <div className="profile-list">
        {teamMembers.map(([name, focus]) => (
          <ProfileMemberCard focus={focus} key={name} name={name} />
        ))}
      </div>
    </section>
  );
}

export default function ProfileRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProfileIndex />} />
    </Routes>
  );
}
