"use client";

import { LiquidMetal, liquidMetalPresets } from '@paper-design/shaders-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface LiquidMetalHeroProps {
  badge?: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  onPrimaryCtaClick: () => void;
  onSecondaryCtaClick?: () => void;
  features?: string[];
  children?: React.ReactNode;
}

export default function LiquidMetalHero({
  badge,
  title,
  subtitle,
  primaryCtaLabel,
  secondaryCtaLabel,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  features = [],
  children,
}: LiquidMetalHeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delayChildren: 0.2, staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  // Use preset[0] which is closest to silver/chrome; override colors for true silver
  const silverPreset = {
    ...liquidMetalPresets[0],
    color1: '#e8e8e8',
    color2: '#b0b0b8',
    color3: '#d4d4dc',
    color4: '#909098',
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <LiquidMetal
        {...silverPreset}
        style={{ position: 'fixed', inset: 0, zIndex: -10 }}
      />

      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <motion.div
          className="text-center space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {badge && (
            <motion.div className="flex justify-center" variants={itemVariants}>
              <Badge
                variant="secondary"
                className="bg-black/10 text-black border-black/20 hover:bg-black/20 transition-colors duration-300 backdrop-blur-sm"
              >
                {badge}
              </Badge>
            </motion.div>
          )}

          <motion.div className="space-y-6" variants={itemVariants}>
            <motion.h1
              role="heading"
              aria-level={1}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-black/85 leading-tight tracking-tight drop-shadow-sm"
              variants={itemVariants}
            >
              {title}
            </motion.h1>

            <motion.p
              className="max-w-3xl mx-auto text-xl sm:text-2xl text-black/65 leading-relaxed"
              variants={itemVariants}
            >
              {subtitle}
            </motion.p>
          </motion.div>

          {children && (
            <motion.div variants={itemVariants}>{children}</motion.div>
          )}

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={buttonVariants}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onPrimaryCtaClick}
                size="lg"
                className="bg-[#f95d0f] text-white hover:bg-[#f95d0f]/90 transition-all duration-300 shadow-2xl text-lg px-8 py-6 font-semibold border-0"
              >
                {primaryCtaLabel}
              </Button>
            </motion.div>

            {secondaryCtaLabel && onSecondaryCtaClick && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onSecondaryCtaClick}
                  variant="outline"
                  size="lg"
                  className="border-black/30 text-black/80 hover:bg-black/10 hover:border-black/50 transition-all duration-300 backdrop-blur-sm text-lg px-8 py-6 font-semibold bg-white/20"
                >
                  {secondaryCtaLabel}
                </Button>
              </motion.div>
            )}
          </motion.div>

          {features.length > 0 && (
            <motion.div className="pt-12" variants={itemVariants}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
                <Card className="bg-white/20 border-black/10 backdrop-blur-md shadow-2xl">
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {features.map((feature, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center justify-center text-center"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                        >
                          <p className="text-black/75 font-medium text-lg">{feature}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
