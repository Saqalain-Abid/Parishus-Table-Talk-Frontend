import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UtensilsCrossed, Coffee, Wine, Users } from 'lucide-react';

interface DiningStyleStepProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const DINING_STYLES = [
  {
    id: 'adventurous',
    name: 'Adventurous',
    description: 'Love trying new and exotic cuisines',
    icon: UtensilsCrossed
  },
  {
    id: 'foodie_enthusiast',
    name: 'Foodie Enthusiast',
    description: 'Passionate about fine food and cooking',
    icon: Coffee
  },
  {
    id: 'local_lover',
    name: 'Local Lover',
    description: 'Prefer neighborhood spots and local gems',
    icon: Users
  },
  {
    id: 'comfort_food',
    name: 'Comfort Food',
    description: 'Enjoy hearty, familiar dishes',
    icon: Wine
  },
  {
    id: 'health_conscious',
    name: 'Health Conscious',
    description: 'Focus on nutritious and organic options',
    icon: Coffee
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Dining is all about the company',
    icon: Users
  }
];

export const DiningStyleStep: React.FC<DiningStyleStepProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">What's your dining style?</h2>
        <p className="text-muted-foreground">
          Choose the type of dining experiences you enjoy most
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DINING_STYLES.map((style) => {
          const Icon = style.icon;
          const isSelected = data.dining_style === style.id;
          
          return (
            <Card
              key={style.id}
              className={`cursor-pointer transition-all hover:shadow-glow ${
                isSelected 
                  ? 'border-peach-gold bg-peach-gold/10' 
                  : 'border-border hover:border-peach-gold/50'
              }`}
              onClick={() => updateData('dining_style', style.id)}
            >
              <CardContent className="p-4 text-center space-y-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto ${
                  isSelected ? 'bg-peach-gold/20' : 'bg-muted'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    isSelected ? 'text-peach-gold' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold">{style.name}</h3>
                  <p className="text-sm text-muted-foreground">{style.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};