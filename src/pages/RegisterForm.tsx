import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabase';
import { FaUserPlus, FaSpinner } from 'react-icons/fa';

type RegisterFormInputs = {
  email: string;
  pass: string; // Changed from 'password' to 'pass'
  confirmPass: string; // Changed from 'confirmPassword' to 'confirmPass'
};

const RegisterForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormInputs>();

  // Watch the password field to validate confirmation
  const passwordValue = watch('pass');

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsSubmitting(true);
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.pass, // Use data.pass here
        // You can add options for email confirmation redirection here if needed
        // options: {
        //   emailRedirectTo: 'http://localhost:5173/login'
        // }
      });

      if (error) {
        console.error('Registration error:', error);
        toast.error(`Erreur d'inscription: ${error.message}`);
      } else if (signUpData.user && signUpData.user.identities?.length === 0) {
        toast.info('Un utilisateur avec cet email existe déjà. Veuillez vérifier vos emails pour confirmer votre compte ou essayez de vous connecter.');
      } else if (signUpData.user) {
        toast.success('Inscription réussie ! Veuillez vérifier vos emails pour confirmer votre compte.');
        navigate('/login');
      } else {
        toast.error('Une erreur inattendue est survenue lors de l\'inscription.');
      }
    } catch (err) {
      console.error('Unexpected registration error:', err);
      toast.error('Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Créer un compte
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
              id="pass" // Changed from 'password' to 'pass'
              type="password"
              autoComplete="new-password"
              className={`form-input mt-1 ${errors.pass ? 'border-red-500' : ''}`}
              {...register('pass', { // Changed from 'password' to 'pass'
                required: 'Le mot de passe est requis',
                minLength: {
                  value: 6,
                  message: 'Le mot de passe doit contenir au moins 6 caractères',
                },
              })}
            />
            {errors.pass && (
              <p className="mt-1 text-sm text-red-600">{errors.pass.message}</p> // Changed from 'password' to 'pass'
            )}
          </div>

          <div>
            <label htmlFor="confirmPass" className="block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPass" // Changed from 'confirmPassword' to 'confirmPass'
              type="password"
              autoComplete="new-password"
              className={`form-input mt-1 ${errors.confirmPass ? 'border-red-500' : ''}`}
              {...register('confirmPass', { // Changed from 'confirmPassword' to 'confirmPass'
                required: 'Veuillez confirmer votre mot de passe',
                validate: (value) =>
                  value === passwordValue || 'Les mots de passe ne correspondent pas',
              })}
            />
            {errors.confirmPass && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPass.message}</p> // Changed from 'confirmPassword' to 'confirmPass'
            )}
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
                  Inscription en cours...
                </>
              ) : (
                <>
                    <FaUserPlus className="mr-2" />
                  S'inscrire
                </>
              )}
                  </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;