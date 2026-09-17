export default function NameAndCodeFields({
  names,
  namesLoading,
  namesLoadFailed,
  selectedName,
  onNameChange,
  code,
  onCodeChange,
}) {
  const namesUnavailable = !namesLoading && names.length === 0;

  return (
    <>
      <label htmlFor="name">Full Name</label>
      <select
        id="name"
        value={selectedName}
        onChange={(event) => onNameChange(event.target.value)}
        disabled={namesLoading || namesUnavailable}
      >
        {namesLoading && <option value="">Loading names...</option>}

        {namesUnavailable && (
          <option value="">{namesLoadFailed ? "Couldn't load names" : 'No names found'}</option>
        )}

        {!namesLoading && !namesUnavailable && (
          <>
            <option value="">Select your name</option>
            {names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </>
        )}
      </select>

      <label htmlFor="code">Personal Code</label>
      <input
        type="text"
        id="code"
        placeholder="e.g. A12345"
        autoComplete="off"
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
      />
    </>
  );
}
