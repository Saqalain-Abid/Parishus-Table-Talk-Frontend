// Cleaned OnboardingCarousel: Removed validation logic

import React, { useState } from 'react';
import { Button } from '@/components/OnboardingCarousel/ui/button';
import { Input } from '@/components/OnboardingCarousel/ui/input';
import { Label } from '@/components/OnboardingCarousel/ui/label';
import { Card } from '@/components/OnboardingCarousel/ui/card';
import { Checkbox } from '@/components/OnboardingCarousel/ui/checkbox';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import ParishUsLogo from '../ui/logo';
import GoogleLogo from '/src/assets/svg/google-logo.svg';
import AppleLogo from '/src/assets/svg/apple-logo.svg';

const onboardingCards = [
  { id: 1, title: 'Join Our Weekly Mystery Dinners', description: "Every Thursday RSVP for a dining event. We'll reveal the restaurant and guests the day before.", image: '/src/assets/images/Carousel 1.png' },
  { id: 2, title: 'Create Your Own Dining Events', description: 'Host your own event and invite your friends to RSVP', image: '/src/assets/images/Carousel 2.png' },
  { id: 3, title: 'Find Your Dining Companion', description: 'We’ll help you connect with others who enjoy the same places you do.', image: '/src/assets/images/Carousel 3.png' },
];

export const OnboardingCarousel = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleNext = () => {
    if (currentStep < onboardingCards.length) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        error ? toast({ title: 'Error', description: error.message, variant: 'destructive' }) : toast({ title: 'Welcome back!', description: 'Signed in successfully.' });
      } else {
        const { error } = await signUp(email, password, { first_name: firstName, last_name: lastName, role: 'user' });
        error ? toast({ title: 'Error', description: error.message, variant: 'destructive' }) : toast({ title: 'Account Created!', description: 'Check your email for verification.' });
        if (!error) setEmail(''); setPassword(''); setFirstName(''); setLastName('');
      }
    } catch {
      toast({ title: 'Error', description: 'Unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === onboardingCards.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-6 bg-gradient-card border-border shadow-card animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <Button onClick={handleBack} variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center">
              <ParishUsLogo />
              <h1 className="text-2xl font-extrabold font-playfair text-primary">ParishUs</h1>
            </div>
            <div className="w-6" />
          </div>

          <div className="flex mb-6 bg-secondary/20 rounded-full p-1">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-full text-sm font-medium ${isLogin ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>Login</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-full text-sm font-medium ${!isLogin ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>Sign Up</button>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" type="text" placeholder='First name' value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" type="text" placeholder='Last name' value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder='Enter your email*' value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1 relative">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder='Enter your password*' value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!isLogin && (
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={agreeToTerms} onCheckedChange={(checked) => setAgreeToTerms(checked === true)} required />
                <Label htmlFor="terms">I agree to the <a href="#" className="text-primary underline">Terms & Conditions</a></Label>
              </div>
            )}
            <Button type="submit" className="w-full py-3 bg-secondary hover:bg-secondary/70 font-semibold" disabled={!isLogin && !agreeToTerms || loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isLogin ? 'Logging in...' : 'Creating account...'}</> : isLogin ? 'Log In' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">OR CONTINUE WITH</span></div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => toast({ title: 'Google login not implemented' })} className="flex-1 py-3 border hover:bg-secondary/40 text-foreground bg-transparent">
                <img src={GoogleLogo} alt="Google" className="w-4 h-4 mr-2" /> Google
              </Button>
              <Button onClick={() => toast({ title: 'Apple login not implemented' })} className="flex-1 py-3 text-white hover:bg-secondary/40 bg-transparent border">
                <img src={AppleLogo} alt="Apple" className="w-4 h-4 mr-2" /> Apple
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const currentCard = onboardingCards[currentStep];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8 bg-gradient-card border-border shadow-card animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-playfair font-extrabold text-primary mb-2">{currentCard.title}</h1>
          <div className="flex justify-center my-6">
            <div className="flex space-x-2">
              {onboardingCards.map((_, index) => (
                <div key={index} className={`w-1 h-1 rounded-full transition-all ${index === currentStep ? 'bg-secondary scale-150' : index < currentStep ? 'bg-secondary/60' : 'bg-border'}`} />
              ))}
            </div>
          </div>
          <p className="font-montserrat text-muted-foreground mb-8">{currentCard.description}</p>
        </div>
        <div className="flex justify-center mb-8 font-montserrat">
          <img className="max-w-60" src={currentCard.image} alt="image" />
        </div>
        <div className="flex justify-between items-center">
          <Button onClick={handleBack} variant="onboardingSecondary" disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <Button className='bg-secondary hover:bg-secondary/70' onClick={handleNext}>
            {currentStep === onboardingCards.length - 1 ? 'Get Started' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};