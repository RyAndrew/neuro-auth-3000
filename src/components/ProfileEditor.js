// import React, { useState } from 'react';
// import { useAuthContext } from './OktaAuth';

const ProfileEditor = () => {
  const { authState, authClient } = useAuthContext();
  const [profile, setProfile] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tokens = await authClient.tokenManager.getTokens();
      const accessToken = tokens.accessToken.accessToken;

      const response = await fetch('/api/updateProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  React.useEffect(() => {
    if (authState.user) {
      setProfile({
        firstName: authState.user.given_name || '',
        lastName: authState.user.family_name || '',
        email: authState.user.email || '',
        phone: authState.user.phone_number || ''
      });
    }
  }, [authState.user]);

  return (
    <div className="card mt-4 profile-editor-card">
      <div className="card-body">
        <h3 className="card-title neon-text">UPDATE PROFILE</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="firstName">FIRST NAME</label>
            <input
              type="text"
              className="form-control"
              id="firstName"
              name="firstName"
              value={profile.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="lastName">LAST NAME</label>
            <input
              type="text"
              className="form-control"
              id="lastName"
              name="lastName"
              value={profile.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="email">EMAIL</label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="phone">PHONE</label>
            <input
              type="tel"
              className="form-control"
              id="phone"
              name="phone"
              value={profile.phone}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-retro btn-retro-primary">
            UPDATE PROFILE
          </button>
        </form>
      </div>
    </div>
  );
};

//export default ProfileManager; 