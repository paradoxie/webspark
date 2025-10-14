'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Heart, Bookmark, Star, ThumbsUp } from 'lucide-react';

interface AnimatedFeedbackProps {
  type: 'success' | 'error' | 'like' | 'bookmark' | 'star' | 'thumbsup';
  trigger: boolean;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

const iconMap = {
  success: Check,
  error: X,
  like: Heart,
  bookmark: Bookmark,
  star: Star,
  thumbsup: ThumbsUp
};

const colorMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  like: 'text-red-500',
  bookmark: 'text-blue-500',
  star: 'text-yellow-500',
  thumbsup: 'text-blue-500'
};

export default function AnimatedFeedback({
  type,
  trigger,
  duration = 1000,
  className = '',
  onComplete
}: AnimatedFeedbackProps) {
  const [show, setShow] = useState(false);
  const Icon = iconMap[type];
  const color = colorMap[type];

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20
          }}
          className={`fixed inset-0 flex items-center justify-center pointer-events-none z-50 ${className}`}
        >
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 0.5,
              times: [0, 0.5, 0.75, 1]
            }}
          >
            <Icon className={`w-24 h-24 ${color}`} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 点赞动画组件
export function LikeAnimation({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (trigger) {
      setParticles(Array.from({ length: 8 }, (_, i) => i));
      const timer = setTimeout(() => setParticles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {particles.map((i) => (
            <motion.div
              key={i}
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
                opacity: 1
              }}
              animate={{
                x: `${50 + Math.cos((i * Math.PI) / 4) * 50}%`,
                y: `${50 + Math.sin((i * Math.PI) / 4) * 50}%`,
                scale: 1,
                opacity: 0
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute"
            >
              <Heart className="w-6 h-6 text-red-500 fill-current" />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// 加载进度条
export function LoadingBar({ loading }: { loading: boolean }) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 10, ease: 'linear' }}
          className="fixed top-0 left-0 right-0 h-1 bg-blue-500 origin-left z-50"
        />
      )}
    </AnimatePresence>
  );
}

// 弹跳按钮
export function BounceButton({
  children,
  onClick,
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick?.();
    setTimeout(() => setIsClicked(false), 300);
  };

  return (
    <motion.button
      onClick={handleClick}
      animate={isClicked ? { scale: [1, 0.9, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// 滑入通知
export function SlideNotification({
  show,
  message,
  type = 'info',
  position = 'top-right',
  duration = 3000,
  onClose
}: {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  duration?: number;
  onClose?: () => void;
}) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  const slideDirection = position.includes('left') ? -100 : 100;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: slideDirection, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: slideDirection, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`fixed ${positionClasses[position]} ${typeClasses[type]} px-6 py-3 rounded-lg shadow-lg z-50`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 脉冲效果
export function PulseEffect({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: 'loop'
            }}
            className="absolute inset-0 rounded-full bg-blue-500 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
