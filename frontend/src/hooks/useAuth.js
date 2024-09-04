import { useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const token = await currentUser.getIdTokenResult();
        setUser({ ...currentUser, role: token.claims.role });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = () => {
    auth.signOut().then(() => {
      setUser(null);
      navigate('/signin');
    });
  };

  return { user, loading, signOut };
};

export default useAuth;
