import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';

interface ArenaLobbyProps {
  theme: 'blue' | 'red';
}

interface Player {
  id: string;
  name: string;
  level: number;
  avatar?: string;
}

interface Battle {
  id: string;
  name: string;
  teamSize: string;
  status: 'waiting' | 'in-progress' | 'completed';
  players: Player[];
  createdAt: string;
}

export const ArenaLobby: React.FC<ArenaLobbyProps> = ({ theme }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'watch'>('create');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [teamSize1, setTeamSize1] = useState('1');
  const [teamSize2, setTeamSize2] = useState('1');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Theme colors based on dashboard theme
  const themeColors = theme === 'blue' 
    ? {
        primary: '#4F46E5',
        secondary: '#3730A3',
        accent: '#818CF8',
        background: '#0F0F23',
        surface: 'rgba(79, 70, 229, 0.15)',
        surfaceSecondary: 'rgba(129, 140, 248, 0.1)',
        text: '#F8FAFC',
        textSecondary: '#CBD5E1',
        border: 'rgba(129, 140, 248, 0.2)',
        card: 'rgba(79, 70, 229, 0.08)',
        cardBorder: 'rgba(129, 140, 248, 0.15)',
      }
    : {
        primary: '#DC2626',
        secondary: '#991B1B',
        accent: '#F87171',
        background: '#1A0F0F',
        surface: 'rgba(220, 38, 38, 0.15)',
        surfaceSecondary: 'rgba(248, 113, 113, 0.1)',
        text: '#F8FAFC',
        textSecondary: '#FECACA',
        border: 'rgba(248, 113, 113, 0.2)',
        card: 'rgba(220, 38, 38, 0.08)',
        cardBorder: 'rgba(248, 113, 113, 0.15)',
      };

  // Mock data
  const availablePlayers: Player[] = [
    { id: '1', name: 'PlayerOne', level: 25 },
    { id: '2', name: 'PlayerTwo', level: 30 },
    { id: '3', name: 'PlayerThree', level: 28 },
    { id: '4', name: 'PlayerFour', level: 32 },
    { id: '5', name: 'PlayerFive', level: 27 },
  ];

  const ongoingBattles: Battle[] = [
    {
      id: '1',
      name: 'Epic Battle Royale',
      teamSize: '3vs3',
      status: 'waiting',
      players: availablePlayers.slice(0, 6),
      createdAt: '2 min ago'
    },
    {
      id: '2',
      name: 'Clash of Titans',
      teamSize: '5vs5',
      status: 'in-progress',
      players: availablePlayers,
      createdAt: '5 min ago'
    },
    {
      id: '3',
      name: 'Quick Duel',
      teamSize: '1vs1',
      status: 'completed',
      players: availablePlayers.slice(0, 2),
      createdAt: '10 min ago'
    }
  ];

  // Filter players based on search query
  const filteredPlayers = availablePlayers.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayerToggle = (player: Player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleCreateLobby = () => {
    console.log('Creating lobby with:', { teamSize: `${teamSize1}vs${teamSize2}`, selectedPlayers });
    // TODO: Implement lobby creation logic
  };

  const toggleLeftPanel = () => {
    setIsLeftPanelCollapsed(!isLeftPanelCollapsed);
  };

  const renderCreateLobbyTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
        Battle Configuration
      </Text>
      
      <View style={styles.configSection}>
        <Text style={[styles.configLabel, { color: themeColors.textSecondary }]}>
          Team Size
        </Text>
        <View style={styles.teamSizeContainer}>
          <View style={styles.teamSizeInputContainer}>
            <Text style={[styles.teamSizeLabel, { color: themeColors.textSecondary }]}>
              Team 1
            </Text>
            <View style={[styles.teamSizeDropdown, { borderColor: themeColors.border }]}>
              <Text style={[styles.teamSizeText, { color: themeColors.text }]}>
                {teamSize1}
              </Text>
              <TouchableOpacity
                style={styles.dropdownArrow}
                onPress={() => {
                  // Simple dropdown logic - cycle through 1-5
                  const current = parseInt(teamSize1);
                  setTeamSize1(current === 5 ? '1' : (current + 1).toString());
                }}
              >
                <Text style={[styles.arrowText, { color: themeColors.textSecondary }]}>
                  ▼
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.teamSizeVS}>
            <Text style={[styles.teamSizeVSText, { color: themeColors.textSecondary }]}>
              vs
            </Text>
          </View>
          
          <View style={styles.teamSizeInputContainer}>
            <Text style={[styles.teamSizeLabel, { color: themeColors.textSecondary }]}>
              Team 2
            </Text>
            <View style={[styles.teamSizeDropdown, { borderColor: themeColors.border }]}>
              <Text style={[styles.teamSizeText, { color: themeColors.text }]}>
                {teamSize2}
              </Text>
              <TouchableOpacity
                style={styles.dropdownArrow}
                onPress={() => {
                  // Simple dropdown logic - cycle through 1-5
                  const current = parseInt(teamSize2);
                  setTeamSize2(current === 5 ? '1' : (current + 1).toString());
                }}
              >
                <Text style={[styles.arrowText, { color: themeColors.textSecondary }]}>
                  ▼
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Text style={[styles.teamSizeHint, { color: themeColors.textSecondary }]}>
          Maximum 5 players per team
        </Text>
      </View>

      <View style={styles.configSection}>
        <Text style={[styles.configLabel, { color: themeColors.textSecondary }]}>
          Invite Players ({selectedPlayers.length} selected)
        </Text>
        
        {/* Search Filter */}
        <View style={[styles.searchContainer, { borderColor: themeColors.border }]}>
          <Text style={[styles.searchIcon, { color: themeColors.textSecondary }]}>
            🔍
          </Text>
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by username or UUID..."
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>
        
        <ScrollView style={styles.playersList} showsVerticalScrollIndicator={false}>
          {filteredPlayers.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerCard,
                { 
                  backgroundColor: themeColors.card,
                  borderColor: selectedPlayers.find(p => p.id === player.id) 
                    ? themeColors.primary 
                    : themeColors.cardBorder
                }
              ]}
              onPress={() => handlePlayerToggle(player)}
            >
              <View style={styles.playerInfo}>
                <View style={[styles.playerAvatar, { backgroundColor: themeColors.primary }]}>
                  <Text style={[styles.playerInitial, { color: themeColors.text }]}>
                    {player.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.playerDetails}>
                  <Text style={[styles.playerName, { color: themeColors.text }]}>
                    {player.name}
                  </Text>
                  <Text style={[styles.playerLevel, { color: themeColors.textSecondary }]}>
                    Level {player.level}
                  </Text>
                  <Text style={[styles.playerUUID, { color: themeColors.textSecondary }]}>
                    ID: {player.id}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.selectionIndicator,
                { 
                  backgroundColor: selectedPlayers.find(p => p.id === player.id) 
                    ? themeColors.primary 
                    : themeColors.border 
                }
              ]} />
            </TouchableOpacity>
          ))}
          
          {filteredPlayers.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={[styles.noResultsText, { color: themeColors.textSecondary }]}>
                No players found matching "{searchQuery}"
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: themeColors.primary }]}
        onPress={handleCreateLobby}
      >
        <Text style={[styles.createButtonText, { color: themeColors.text }]}>
          Create Lobby
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderWatchLobbyTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
        Ongoing Battles
      </Text>
      
      <ScrollView style={styles.battlesList} showsVerticalScrollIndicator={false}>
        {ongoingBattles.map((battle) => (
          <View
            key={battle.id}
            style={[
              styles.battleCard,
              { 
                backgroundColor: themeColors.card,
                borderColor: themeColors.cardBorder
              }
            ]}
          >
            <View style={styles.battleHeader}>
              <Text style={[styles.battleName, { color: themeColors.text }]}>
                {battle.name}
              </Text>
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: battle.status === 'waiting' 
                    ? themeColors.accent 
                    : battle.status === 'in-progress'
                    ? themeColors.primary
                    : themeColors.textSecondary
                }
              ]}>
                <Text style={[styles.statusText, { color: themeColors.text }]}>
                  {battle.status.replace('-', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.battleDetails}>
              <Text style={[styles.battleInfo, { color: themeColors.textSecondary }]}>
                {battle.teamSize} • {battle.players.length} players • {battle.createdAt}
              </Text>
            </View>

            <View style={styles.battlePlayers}>
              {battle.players.slice(0, 4).map((player, index) => (
                <View key={player.id} style={styles.battlePlayer}>
                  <View style={[styles.battlePlayerAvatar, { backgroundColor: themeColors.primary }]}>
                    <Text style={[styles.battlePlayerInitial, { color: themeColors.text }]}>
                      {player.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={[styles.battlePlayerName, { color: themeColors.textSecondary }]}>
                    {player.name}
                  </Text>
                </View>
              ))}
              {battle.players.length > 4 && (
                <Text style={[styles.morePlayers, { color: themeColors.textSecondary }]}>
                  +{battle.players.length - 4} more
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { padding: 30 }]}>
      {/* Left Panel - Arena Lobby */}
      <View style={[
        styles.leftPanel,
        { 
          width: isLeftPanelCollapsed ? 80 : 400, // Increased collapsed width to accommodate button
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border
        }
      ]}>
        {/* Collapse/Expand Button */}
        <TouchableOpacity
          style={[styles.collapseButton, { backgroundColor: themeColors.primary }]}
          onPress={toggleLeftPanel}
        >
          <Text style={[styles.collapseButtonText, { color: themeColors.text }]}>
            {isLeftPanelCollapsed ? '→' : '←'}
          </Text>
        </TouchableOpacity>

        {!isLeftPanelCollapsed && (
          <>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'create' && { 
                    backgroundColor: themeColors.primary,
                    borderColor: themeColors.primary
                  }
                ]}
                onPress={() => setActiveTab('create')}
              >
                <Text style={[
                  styles.tabText,
                  { 
                    color: activeTab === 'create' 
                      ? themeColors.text 
                      : themeColors.textSecondary
                  }
                ]}>
                  Create Lobby
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'watch' && { 
                    backgroundColor: themeColors.primary,
                    borderColor: themeColors.primary
                  }
                ]}
                onPress={() => setActiveTab('watch')}
              >
                <Text style={[
                  styles.tabText,
                  { 
                    color: activeTab === 'watch' 
                      ? themeColors.text 
                      : themeColors.textSecondary
                  }
                ]}>
                  Watch Lobby
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'create' ? renderCreateLobbyTab() : renderWatchLobbyTab()}
          </>
        )}
      </View>

      {/* Right Panel - Message Layer */}
      <View style={[
        styles.rightPanel,
        { 
          backgroundColor: themeColors.surfaceSecondary,
          borderColor: themeColors.border
        }
      ]}>
        <View style={styles.messageLayerHeader}>
          <Text style={[styles.messageLayerTitle, { color: themeColors.text }]}>
            Message Layer
          </Text>
        </View>
        
        <ScrollView style={styles.messageLayerContent} showsVerticalScrollIndicator={false}>
          <View style={styles.messagePlaceholder}>
            <Text style={[styles.placeholderText, { color: themeColors.textSecondary }]}>
              Message functionality will be implemented here
            </Text>
            <Text style={[styles.placeholderSubtext, { color: themeColors.textSecondary }]}>
              Chat, notifications, and battle updates
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
  },
  leftPanel: {
    borderWidth: 1,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden', // Changed back to 'hidden' since button is now inside
    minWidth: 80, // Ensure minimum width to accommodate the button
  },
  collapseButton: {
    position: 'absolute',
    right: 10, // Position inside the panel, 10px from right edge
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  collapseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16, // Ensure proper vertical centering
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingRight: 56, // Increase right padding to make more room for the collapsible button
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10, // Reduce horizontal padding further to make tabs narrower
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  configSection: {
    marginBottom: 24,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  teamSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamSizeInputContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamSizeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  teamSizeDropdown: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  teamSizeText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  dropdownArrow: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  teamSizeVS: {
    paddingHorizontal: 16,
  },
  teamSizeVSText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.7,
  },
  teamSizeHint: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  playersList: {
    maxHeight: 200,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitial: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerLevel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 2,
  },
  playerUUID: {
    fontSize: 10,
    opacity: 0.6,
    fontFamily: 'monospace',
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  createButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  battlesList: {
    flex: 1,
  },
  battleCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  battleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  battleName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  battleDetails: {
    marginBottom: 12,
  },
  battleInfo: {
    fontSize: 12,
    opacity: 0.8,
  },
  battlePlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  battlePlayer: {
    alignItems: 'center',
  },
  battlePlayerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  battlePlayerInitial: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  battlePlayerName: {
    fontSize: 10,
    opacity: 0.8,
  },
  morePlayers: {
    fontSize: 10,
    opacity: 0.6,
  },
  rightPanel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageLayerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageLayerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  messageLayerContent: {
    flex: 1,
    padding: 16,
  },
  messagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});
