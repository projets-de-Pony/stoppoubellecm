import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabase';
import { FaSignInAlt, FaSpinner } from 'react-icons/fa';

type LoginFormInputs = {
  email: string;
  pass: string;
};

const LoginForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const onSubmit = async (data: LoginFormInputs) => {
    setIsSubmitting(true);
    try {
      // Connexion de l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.pass,
      });

      if (authError) {
        console.error('Login error:', authError);
        toast.error(`Erreur de connexion: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        toast.error('Erreur de connexion: Utilisateur non trouvé');
        return;
      }

      // Récupérer le profil de l'utilisateur pour vérifier son rôle
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        toast.error('Erreur lors de la récupération du profil');
        return;
      }

      toast.success('Connexion réussie !');

      // Redirection en fonction du rôle
      if (profileData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      toast.error('Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Se connecter
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`form-input mt-1 ${errors.email ? 'border-red-500' : ''}`}
              {...register('email', {
                required: 'L\'adresse e-mail est requise',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Adresse e-mail invalide',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="pass" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="pass"
              type="password"
              autoComplete="current-password"
              className={`form-input mt-1 ${errors.pass ? 'border-red-500' : ''}`}
              {...register('pass', { required: 'Le mot de passe est requis' })}
            />
            {errors.pass && (
              <p className="mt-1 text-sm text-red-600">{errors.pass.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              {/* <a href="#" className="font-medium text-primary-600 hover:text-primary-500"> Mot de passe oublié? </a> */}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center btn btn-primary py-2 px-4"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <FaSignInAlt className="mr-2" />
                  Se connecter
                </>
              )}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            Inscrivez-vous
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;