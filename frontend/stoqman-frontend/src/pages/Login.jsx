import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ShieldCheckIcon, 
  LockClosedIcon,
  UserCircleIcon,
  CheckCircleIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { authAPI, userAPI } from '../services/api';
import { auth } from '../utils/auth';
import Button from '../components/ui/Button';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.username.trim()) {
      setError('Email or username is required');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData);
      const { access, refresh } = response.data;
      
      auth.login({ access, refresh });
      
      try {
        const userResponse = await userAPI.getProfile();
        const userData = userResponse.data;
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (profileError) {
        console.warn('Could not fetch user profile:', profileError);
      }

      setSuccess('Welcome back! Redirecting to your dashboard...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response?.status === 401) {
        setError('Invalid credentials. Please check your email and password.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Connection failed. Please check if the backend server is running.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-800 via-emerald-700 to-teal-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-teal-600/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="relative w-full h-full">
              {/* Floating elements */}
              <div className="absolute top-20 left-20 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
              <div className="absolute top-40 right-32 w-8 h-8 bg-green-300/20 rounded-full animate-bounce"></div>
              <div className="absolute bottom-40 left-16 w-12 h-12 bg-emerald-300/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-20 right-20 w-20 h-20 bg-white/5 rounded-full"></div>
              <div className="absolute top-1/2 left-1/3 w-6 h-6 bg-teal-300/20 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="text-center max-w-md">
            {/* Logo */}
            <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20">
              <span className="text-4xl font-bold bg-gradient-to-br from-white to-green-100 bg-clip-text text-transparent">S</span>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-green-100 to-emerald-100 bg-clip-text text-transparent">
              StoqMan
            </h1>
            <p className="text-xl text-green-100 mb-12 leading-relaxed">
              Smart Inventory & Billing Management
            </p>

            {/* Simple Features */}
            <div className="space-y-6 text-left">
              <div className="flex items-center space-x-4 group">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                  <CheckCircleIcon className="w-6 h-6 text-emerald-300" />
                </div>
                <span className="text-green-100 text-lg">Real-time inventory tracking</span>
              </div>
              <div className="flex items-center space-x-4 group">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <CheckCircleIcon className="w-6 h-6 text-green-300" />
                </div>
                <span className="text-green-100 text-lg">Professional invoicing</span>
              </div>
              <div className="flex items-center space-x-4 group">
                <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                  <CheckCircleIcon className="w-6 h-6 text-teal-300" />
                </div>
                <span className="text-green-100 text-lg">Detailed analytics & reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white font-bold text-3xl">S</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">StoqMan</h2>
          </div>

          {/* Login Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-green-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
              <p className="text-green-100 text-sm">Access your dashboard</p>
            </div>

            {/* Form */}
            <div className="px-8 py-10">
              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-green-700 text-sm font-medium">{success}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="flex items-center">
                    <LockClosedIcon className="w-4 h-4 text-red-500 mr-3 flex-shrink-0" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email/Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-3">
                    Email or Username
                  </label>
                  <div className="relative">
                    <UserCircleIcon className="w-5 h-5 text-green-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="email"
                      required
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-700"
                      placeholder="Enter your email or username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="w-5 h-5 text-green-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-700"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors"
                    onClick={() => alert('Contact your system administrator to reset your password.')}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full py-4 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform transition-all duration-200 hover:scale-[1.02] disabled:transform-none rounded-2xl shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Create Account */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Need an account?{' '}
                  <button
                    onClick={() => alert('Contact your administrator to create an account.')}
                    className="font-semibold text-green-600 hover:text-green-500 transition-colors"
                  >
                    Contact Administrator
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-white/70 backdrop-blur-sm rounded-full border border-green-200">
              <ShieldCheckIcon className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Secure & Encrypted</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500 space-y-3">
            <p>© 2024 StoqMan. All rights reserved.</p>
            <div className="space-x-4">
              <button className="hover:text-green-600 transition-colors">Privacy</button>
              <span>•</span>
              <button className="hover:text-green-600 transition-colors">Terms</button>
              <span>•</span>
              <button className="hover:text-green-600 transition-colors">Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;