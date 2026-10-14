'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, User, Phone, MapPin, Truck, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cityId, setCityId] = useState('11111111-1111-1111-1111-111111111111'); // Lahore
  const [primaryPlatform, setPrimaryPlatform] = useState('indrive');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await register({
        fullName,
        email,
        password,
        phoneNumber,
        cityId,
        primaryPlatform,
      });
      if (!ok) {
        setError('Registration could not be completed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#1B4332] text-white font-medium text-sm flex items-center justify-center mx-auto mb-3">
            FG
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#22252A]">Create your account</h1>
          <p className="text-sm text-[#5B6370] mt-1">
            Register to track earnings and verify your work.
          </p>
        </div>

        <div className="bg-white border border-[#E1E4EA] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-xs rounded-lg" role="alert">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#5B6370] mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#5B6370] absolute left-3 top-3.5" aria-hidden="true" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tariq Mehmood"
                  className="focus-ring w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-[#E1E4EA] rounded-lg transition-colors bg-white text-[#22252A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5B6370] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#5B6370] absolute left-3 top-3.5" aria-hidden="true" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="worker@fairgig.pk"
                    className="focus-ring w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-[#E1E4EA] rounded-lg transition-colors bg-white text-[#22252A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5B6370] mb-1.5">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#5B6370] absolute left-3 top-3.5" aria-hidden="true" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="focus-ring w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-[#E1E4EA] rounded-lg transition-colors bg-white text-[#22252A]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5B6370] mb-1.5">
                  City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#5B6370] absolute left-3 top-3.5" aria-hidden="true" />
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="focus-ring w-full pl-9 pr-3 py-2.5 text-base sm:text-sm min-h-[44px] border border-[#E1E4EA] rounded-lg transition-colors bg-white text-[#22252A]"
                  >
                    <option value="11111111-1111-1111-1111-111111111111">Lahore</option>
                    <option value="22222222-2222-2222-2222-222222222222">Karachi</option>
                    <option value="33333333-3333-3333-3333-333333333333">Islamabad</option>
                    <option value="44444444-4444-4444-4444-444444444444">Rawalpindi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5B6370] mb-1.5">
                  Primary platform
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 text-[#5B6370] absolute left-3 top-3.5" aria-hidden="true" />
                  <select
                    value={primaryPlatform}
                    onChange={(e) => setPrimaryPlatform(e.target.value)}
                    className="focus-ring w-full pl-9 pr-3 py-2.5 text-base sm:text-sm min-h-[44px] border border-[#E1E4EA] rounded-lg transition-colors bg-white text-[#22252A]"
                  >
                    <option value="indrive">inDrive</option>
                    <option value="bykea">Bykea</option>
                    <option value="foodpanda">Foodpanda</option>
                    <option value="careem">Careem</option>
                    <option value="yango">Yango</option>
                    <option value="cheetay">Cheetay</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5B6370] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5B6370] absolute left-3 top-3.5" aria-hidden="true" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="focus-ring w-full pl-9 pr-3 py-2.5 text-base sm:text-sm min-h-[44px] border border-[#E1E4EA] rounded-lg transition-colors bg-white text-[#22252A]"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF9F5] border border-[#E1E4EA] rounded-lg text-xs text-[#5B6370]">
              New registrations are assigned to the Worker workspace.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="focus-ring w-full min-h-[44px] py-2.5 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#5B6370]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#1B4332] hover:underline focus-ring rounded">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
