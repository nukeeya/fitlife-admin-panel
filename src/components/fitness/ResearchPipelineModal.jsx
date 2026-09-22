import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { CheckCircle2, Loader2, BookOpen, Database, Cpu, Award } from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: 1,
    title: 'Biometric & Caloric Profiling',
    desc: 'Computing Mifflin-St Jeor BMR, ACSM activity multipliers, and macro partitions...',
    icon: Cpu,
    duration: 1200
  },
  {
    id: 2,
    title: 'Evidence-Based Literature Synthesis',
    desc: 'Querying sports nutrition & exercise science databases (PubMed, BJSM, ISSN, ACSM)...',
    icon: BookOpen,
    duration: 1400
  },
  {
    id: 3,
    title: 'Bangladeshi Food Database Integration',
    desc: 'Mapping local staples (Bhaat, Roti, Rui, Deshi Chicken, Tok Doi, Shaak) for macro parity...',
    icon: Database,
    duration: 1200
  },
  {
    id: 4,
    title: 'Progressive Overload & Periodization Formulation',
    desc: 'Generating volume landmarks, RPE/RIR thresholds, and session adaptation protocols...',
    icon: Award,
    duration: 1100
  }
];

export default function ResearchPipelineModal({ isOpen, onClose, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setCompletedSteps([]);
      setIsFinished(false);
      return;
    }

    let isMounted = true;
    let timeoutId;

    const runStep = (index) => {
      if (!isMounted) return;
      if (index >= PIPELINE_STEPS.length) {
        setIsFinished(true);
        timeoutId = setTimeout(() => {
          if (isMounted) {
            onComplete();
          }
        }, 800);
        return;
      }

      setCurrentStepIndex(index);
      const step = PIPELINE_STEPS[index];

      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        setCompletedSteps(prev => [...prev, step.id]);
        runStep(index + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isOpen, onComplete]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isFinished ? onClose : () => {}}
      title="Evidence-Based Synthesis Engine"
      size="md"
    >
      <div style={{ padding: '0.5rem 0' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '1.75rem',
          padding: '1.25rem',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            marginBottom: '0.75rem',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
          }}>
            <Cpu size={24} className="spin-slow" />
          </div>
          <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Synthesizing Scientific Fitness Plan
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Processing biometrics, medical clearance, local dietary staples & peer-reviewed research
          </p>
        </div>

        {/* Pipeline Step List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = completedSteps.includes(step.id);
            const isCurrent = currentStepIndex === idx && !isDone;
            const isPending = currentStepIndex < idx;

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.9rem',
                  padding: '0.9rem 1rem',
                  borderRadius: '10px',
                  background: isCurrent
                    ? 'rgba(239, 68, 68, 0.08)'
                    : isDone
                    ? 'rgba(16, 185, 129, 0.06)'
                    : 'var(--bg-main)',
                  border: isCurrent
                    ? '1px solid var(--primary)'
                    : isDone
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid var(--border-color)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  marginTop: '2px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: isDone
                    ? 'rgba(16, 185, 129, 0.2)'
                    : isCurrent
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'var(--border-color)',
                  color: isDone
                    ? '#10b981'
                    : isCurrent
                    ? 'var(--primary)'
                    : 'var(--text-muted)'
                }}>
                  {isDone ? (
                    <CheckCircle2 size={16} />
                  ) : isCurrent ? (
                    <Loader2 size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                  ) : (
                    <Icon size={14} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: isDone ? '#10b981' : isCurrent ? 'var(--text-main)' : 'var(--text-muted)'
                  }}>
                    {step.title}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: isCurrent ? 'var(--text-main)' : 'var(--text-muted)',
                    marginTop: '2px',
                    opacity: isPending ? 0.6 : 0.95
                  }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active progress bar */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{
            height: '6px',
            borderRadius: '999px',
            background: 'var(--border-color)',
            overflow: 'hidden'
          }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary) 0%, #10b981 100%)',
                width: `${((completedSteps.length) / PIPELINE_STEPS.length) * 100}%`,
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <span>Evidence Integration: {Math.round(((completedSteps.length) / PIPELINE_STEPS.length) * 100)}%</span>
            <span>{isFinished ? 'Ready to present!' : 'Analyzing clinical data...'}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
