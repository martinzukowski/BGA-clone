/**
 * The card inspector.
 *
 * Hovering any card anywhere — hand, forum, discard pile — brings the full face
 * up at reading size in the corner of the board. It is what lets the forum sit
 * small most of the time without ever costing the player information.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { getCardDef } from '../../game/data/cards';
import { useGame } from '../../store/game';
import { PersonalityCard } from './PersonalityCard';

export function CardInspector() {
  const defId = useGame((s) => s.interaction.inspectingCard);
  const def = defId ? getCardDef(defId) : null;

  return (
    <AnimatePresence>
      {def && (
        <motion.div
          key={def.defId}
          initial={{ opacity: 0, x: -14, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -10, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 460, damping: 34 }}
          className="pointer-events-none absolute bottom-3 left-3 z-20"
          style={{ filter: 'drop-shadow(0 22px 40px rgb(0 0 0 / .65))' }}
        >
          <PersonalityCard defId={def.defId} size="medium" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
