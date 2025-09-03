import { createClient } from '@supabase/supabase-js';
import { add } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and service role key are required.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateNextBillDate() {
  const { data: lofts, error } = await supabase.from('lofts').select('*');

  if (error) {
    console.error('Error fetching lofts:', error);
    return;
  }

  for (const loft of lofts) {
    const updates: any = {};
    const today = new Date();

    const utilities = [
      'eau',
      'electricite',
      'gaz',
      'telephone',
      'internet',
    ];

    for (const utility of utilities) {
      const nextDueDate = loft[`prochaine_echeance_${utility}`];
      const frequency = loft[`frequence_paiement_${utility}`];

      if (nextDueDate && new Date(nextDueDate) < today) {
        let newDate;
        switch (frequency) {
          case 'hebdomadaire':
            newDate = add(new Date(nextDueDate), { weeks: 1 });
            break;
          case 'mensuel':
            newDate = add(new Date(nextDueDate), { months: 1 });
            break;
          case 'bimestriel':
            newDate = add(new Date(nextDueDate), { months: 2 });
            break;
          case 'trimestriel':
            newDate = add(new Date(nextDueDate), { months: 3 });
            break;
          case 'semestriel':
            newDate = add(new Date(nextDueDate), { months: 6 });
            break;
          case 'annuel':
            newDate = add(new Date(nextDueDate), { years: 1 });
            break;
          default:
            newDate = new Date(nextDueDate);
        }
        updates[`prochaine_echeance_${utility}`] = newDate.toISOString().split('T')[0];
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('lofts')
        .update(updates)
        .eq('id', loft.id);

      if (updateError) {
        console.error(`Error updating loft ${loft.id}:`, updateError);
      }
    }
  }
}

updateNextBillDate();
