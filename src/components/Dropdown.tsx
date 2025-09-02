import React, { useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// @ts-ignore - react-dom is available on web only
import ReactDOM from 'react-dom';

type Option = { label: string; value: string };

type DropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
};

export const Dropdown: React.FC<DropdownProps> = ({ value, onChange, options, placeholder = 'Select...', error }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value)?.label ?? '';
  const anchorRef = useRef<View>(null);
  const rect = useMemo(() => ({ top: 0, left: 0, width: 0, height: 0, bottom: 0 }), []);

  return (
    <View ref={anchorRef} style={[styles.container, open ? styles.containerOpen : undefined]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (Platform.OS === 'web' && anchorRef.current) {
            // measure DOM rect for portal positioning
            const el: any = anchorRef.current;
            const bounds = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
            if (bounds) {
              rect.top = bounds.top;
              rect.left = bounds.left;
              rect.width = bounds.width;
              rect.height = bounds.height;
              // @ts-ignore
              rect.bottom = bounds.bottom;
            }
          }
          setOpen(!open);
        }}
        style={[styles.input, error ? styles.inputError : undefined]}
      >
        <Text style={[styles.valueText, !selected ? styles.placeholder : undefined]}>{selected || placeholder}</Text>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {open && Platform.OS !== 'web' && (
        <View style={styles.menu}>
          {options.map(opt => (
            <TouchableOpacity key={opt.value} style={styles.option} onPress={() => { onChange(opt.value); setOpen(false); }}>
              <Text style={styles.optionText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {open && Platform.OS === 'web' && ReactDOM && ReactDOM.createPortal(
        <View style={styles.portalRoot}>
          <TouchableOpacity style={styles.portalBackdrop} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={[styles.menuPortal, { top: rect.bottom + 6, left: rect.left, width: rect.width }]}>
            {options.map(opt => (
              <TouchableOpacity key={opt.value} style={styles.option} onPress={() => { onChange(opt.value); setOpen(false); }}>
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>,
        document.body
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignSelf: 'center', width: '100%', maxWidth: 420, marginBottom: 16, position: 'relative' },
  containerOpen: { zIndex: 9999 },
  input: {
    borderWidth: 1,
    borderColor: '#2A2E33',
    backgroundColor: '#121417',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: { borderColor: '#FF6B6B' },
  valueText: { color: '#E6E8EB', fontSize: 16 },
  placeholder: { color: '#9BA1A6' },
  chevron: { color: '#E6E8EB', fontSize: 16, marginLeft: 12 },
  errorText: { color: '#FF6B6B', marginTop: 6, fontSize: 12 },

  menu: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, backgroundColor: '#121417', borderRadius: 12, borderWidth: 1, borderColor: '#2A2E33', width: '100%', paddingVertical: 6, zIndex: 10000, elevation: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  // Web portal overlay
  portalRoot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 } as any,
  portalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as any,
  menuPortal: { position: 'absolute', backgroundColor: '#121417', borderRadius: 12, borderWidth: 1, borderColor: '#2A2E33', paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } } as any,
  option: { paddingVertical: 12, paddingHorizontal: 14 },
  optionText: { color: '#E6E8EB', fontSize: 16 },
});


