import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, TextInput, ScrollView } from 'react-native';

interface LobbyHubProps {
  theme: 'blue' | 'red';
}

interface Friend {
  id: string;
  username: string;
  isOnline: boolean;
  avatar?: string;
}

interface Player {
  id: string;
  username: string;
  avatar?: string;
  team: 'team1' | 'team2' | null;
  slot: number | null;
  isReady: boolean;
}

// Generate unique IDs
const generateLobbyId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const LobbyHub: React.FC<LobbyHubProps> = ({ theme }) => {
  const [currentStep, setCurrentStep] = useState<'lobby-info' | 'player-invitation' | 'player-lobby'>('lobby-info');
  const [isCreateExpanded, setIsCreateExpanded] = useState(false);
  const [showLobbyCreation, setShowLobbyCreation] = useState(false);
  const [lobbyDetails, setLobbyDetails] = useState({
    team1Size: '1',
    team2Size: '1',
    gameMode: 'casual' as 'ranked' | 'casual',
    lobbyId: generateLobbyId(),
    isPublic: true,
  });
  const [inviteCode, setInviteCode] = useState(generateInviteCode());
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mockPlayers, setMockPlayers] = useState<Player[]>([
    { id: '1', username: 'LobbyCreator', team: 'team1', slot: 0, isReady: true }, // Lobby creator automatically ready
    { id: '2', username: 'PlayerTwo', team: 'team1', slot: 1, isReady: false }, // Changed to false for testing
  ]);

  // Use the exact same theme colors from the dashboards
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
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        team1: '#EF4444',
        team2: '#3B82F6',
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
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        team1: '#EF4444',
        team2: '#3B82F6',
      };

  const mockFriends: Friend[] = [
    { id: '1', username: 'PlayerOne', isOnline: true },
    { id: '2', username: 'PlayerTwo', isOnline: false },
    { id: '3', username: 'PlayerThree', isOnline: true },
    { id: '4', username: 'PlayerFour', isOnline: true },
    { id: '5', username: 'PlayerFive', isOnline: false },
  ];



  // Calculate total expected players based on team configuration
  const totalExpectedPlayers = parseInt(lobbyDetails.team1Size) + parseInt(lobbyDetails.team2Size);
  
  // Get actual players that are in slots (not empty slots)
  const actualPlayers = mockPlayers.filter(p => p.team && p.slot !== null);
  
  // Check if all actual players are ready
  const allPlayersReady = actualPlayers.length > 0 && actualPlayers.every(p => p.isReady);

  // Function to toggle lobby creator ready status
  const toggleLobbyCreatorReady = () => {
    setMockPlayers(prev => {
      const updated = prev.map(player => 
        player.username === 'LobbyCreator' 
          ? { ...player, isReady: !player.isReady }
          : player
      );
      console.log('Updated mockPlayers:', updated);
      return updated;
    });
  };

  const onNextStep = () => {
    switch (currentStep) {
      case 'lobby-info':
        setCurrentStep('player-invitation');
        break;
      case 'player-invitation':
        setCurrentStep('player-lobby');
        break;
      case 'player-lobby':
        // Battle starts here - this is the final step
        console.log('Battle starting!');
        break;
    }
  };

  const handleCreateButtonClick = () => {
    setShowLobbyCreation(true);
  };

  const handleBackToMain = () => {
    setShowLobbyCreation(false);
    setCurrentStep('lobby-info'); // Reset to first step
  };

  const renderSectionHeader = (title: string) => (
    <View style={[styles.sectionHeader, { backgroundColor: themeColors.surface }]}>
      <Text style={[styles.sectionHeaderText, { color: themeColors.text }]}>
        {title}
      </Text>
    </View>
  );

  const renderHorizontalStripe = () => (
    <View style={[styles.horizontalStripe, { backgroundColor: themeColors.border }]} />
  );

  const renderCreateButton = () => (
    <View style={styles.createButtonContainer}>
      <TouchableOpacity
        style={[styles.createMainButton, { backgroundColor: '#10B981' }]}
        onPress={handleCreateButtonClick}
        activeOpacity={0.8}
      >
        <Text style={[styles.createMainButtonText, { color: '#FFFFFF' }]}>
          + Create New Lobby
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBackArrow = () => (
    <TouchableOpacity
      style={[styles.backArrow, { borderColor: themeColors.border }]}
      onPress={handleBackToMain}
    >
      <Text style={[styles.backArrowText, { color: themeColors.text }]}>
        ←
      </Text>
    </TouchableOpacity>
  );

  const renderProgressIndicator = () => (
    <View style={[styles.progressContainer, { backgroundColor: themeColors.surface }]}>
      <View style={styles.progressSteps}>
        {[
          { key: 'lobby-info', label: 'Lobby Info', active: currentStep === 'lobby-info' },
          { key: 'player-invitation', label: 'Invitations', active: currentStep === 'player-invitation' },
          { key: 'player-lobby', label: 'Team Selection', active: currentStep === 'player-lobby' },
        ].map((step, index) => (
          <View key={step.key} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              { 
                backgroundColor: step.active ? themeColors.primary : themeColors.border,
                borderColor: step.active ? themeColors.primary : themeColors.border
              }
            ]}>
              <Text style={[styles.progressNumber, { color: step.active ? '#FFFFFF' : themeColors.textSecondary }]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.progressLabel,
              { color: step.active ? themeColors.primary : themeColors.textSecondary }
            ]}>
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderLobbyInformationScreen = () => (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <Text style={[styles.screenTitle, { color: themeColors.text }]}>
          Lobby Information
        </Text>
        
        {/* Lobby ID */}
        <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
          <View style={[styles.lobbyIdContainer, { borderColor: themeColors.primary }]}>
            <Text style={[styles.lobbyIdText, { color: themeColors.text }]}>
              Lobby ID: {lobbyDetails.lobbyId}
            </Text>
          </View>
        </View>

        {/* Lobby Visibility */}
        <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Lobby Visibility
          </Text>
          <View style={styles.visibilityContainer}>
            <TouchableOpacity
              style={[
                styles.visibilityButton,
                { 
                  backgroundColor: lobbyDetails.isPublic ? themeColors.primary : themeColors.surfaceSecondary,
                  borderColor: lobbyDetails.isPublic ? themeColors.primary : themeColors.border
                }
              ]}
              onPress={() => setLobbyDetails(prev => ({ ...prev, isPublic: true }))}
            >
              <Text style={[styles.visibilityButtonText, { color: themeColors.text }]}>
                Public
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.visibilityButton,
                { 
                  backgroundColor: !lobbyDetails.isPublic ? themeColors.primary : themeColors.surfaceSecondary,
                  borderColor: !lobbyDetails.isPublic ? themeColors.primary : themeColors.border
                }
              ]}
              onPress={() => setLobbyDetails(prev => ({ ...prev, isPublic: false }))}
            >
              <Text style={[styles.visibilityButtonText, { color: themeColors.text }]}>
                Private
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Team Configuration */}
        <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Team Configuration
          </Text>
          <View style={styles.teamConfig}>
            <View style={styles.teamSizeInput}>
              <Text style={[styles.teamLabel, { color: themeColors.textSecondary }]}>
                Team 1 Size
              </Text>
              <View style={[styles.dropdown, { borderColor: themeColors.border }]}>
                <Text style={[styles.dropdownText, { color: themeColors.text }]}>
                  {lobbyDetails.team1Size}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const current = parseInt(lobbyDetails.team1Size);
                    setLobbyDetails(prev => ({
                      ...prev,
                      team1Size: current === 5 ? '1' : (current + 1).toString()
                    }));
                  }}
                >
                  <Text style={[styles.dropdownArrow, { color: themeColors.textSecondary }]}>
                    ▼
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.teamVS}>
              <Text style={[styles.vsText, { color: themeColors.textSecondary }]}>
                vs
              </Text>
            </View>
            
            <View style={styles.teamSizeInput}>
              <Text style={[styles.teamLabel, { color: themeColors.textSecondary }]}>
                Team 2 Size
              </Text>
              <View style={[styles.dropdown, { borderColor: themeColors.border }]}>
                <Text style={[styles.dropdownText, { color: themeColors.text }]}>
                  {lobbyDetails.team2Size}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const current = parseInt(lobbyDetails.team2Size);
                    setLobbyDetails(prev => ({
                      ...prev,
                      team2Size: current === 5 ? '1' : (current + 1).toString()
                    }));
                  }}
                >
                  <Text style={[styles.dropdownArrow, { color: themeColors.textSecondary }]}>
                    ▼
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Game Mode */}
        <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Game Mode
          </Text>
          <View style={styles.gameModeContainer}>
            <TouchableOpacity
              style={[
                styles.gameModeButton,
                { 
                  backgroundColor: lobbyDetails.gameMode === 'ranked' ? themeColors.primary : themeColors.surfaceSecondary,
                  borderColor: lobbyDetails.gameMode === 'ranked' ? themeColors.primary : themeColors.border
                }
              ]}
              onPress={() => setLobbyDetails(prev => ({ ...prev, gameMode: 'ranked' }))}
            >
              <Text style={[styles.gameModeText, { color: themeColors.text }]}>
                Ranked
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.gameModeButton,
                { 
                  backgroundColor: lobbyDetails.gameMode === 'casual' ? themeColors.primary : themeColors.surfaceSecondary,
                  borderColor: lobbyDetails.gameMode === 'casual' ? themeColors.primary : themeColors.border
                }
              ]}
              onPress={() => setLobbyDetails(prev => ({ ...prev, gameMode: 'casual' }))}
            >
              <Text style={[styles.gameModeText, { color: themeColors.text }]}>
                Casual
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.gameModeDetails, { color: themeColors.textSecondary }]}>
            {lobbyDetails.gameMode === 'ranked' 
              ? 'Reputation points and Reward will be gained here (reputation points decreases if lost)'
              : 'No reputation points lost or gain, and no rewards'
            }
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: themeColors.primary }]}
          onPress={onNextStep}
        >
          <Text style={[styles.nextButtonText, { color: '#FFFFFF' }]}>
            Next: Player Invitation
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

    const renderPlayerInvitationScreen = () => (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <View style={styles.playerInvitationHeader}>
          <Text style={[styles.screenTitle, { color: themeColors.text }]}>
            Player Invitation
          </Text>
          <View style={styles.searchAndInviteContainer}>
            <View style={[styles.searchContainer, { borderColor: themeColors.border }]}>
              <TextInput
                style={[styles.searchInput, { color: themeColors.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by username or ID..."
                placeholderTextColor={themeColors.textSecondary}
              />
              <TouchableOpacity style={styles.searchButton}>
                <Text style={[styles.searchIcon, { color: themeColors.primary }]}>
                  🔍
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[
                styles.bulkInviteButton, 
                { 
                  backgroundColor: selectedFriends.length > 0 ? themeColors.primary : themeColors.textSecondary,
                  opacity: selectedFriends.length > 0 ? 1 : 0.5
                }
              ]}
              onPress={() => {
                if (selectedFriends.length > 0) {
                  console.log('Inviting selected friends:', selectedFriends);
                  // TODO: Implement bulk invite logic
                }
              }}
              disabled={selectedFriends.length === 0}
            >
              <Text style={[styles.bulkInviteButtonText, { color: '#FFFFFF' }]}>
                Invite Selected ({selectedFriends.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Friend Invite */}
        <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Friend Invite
          </Text>
          <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
            {mockFriends.map((friend) => (
              <TouchableOpacity
                key={friend.id}
                style={[
                  styles.friendItem,
                  selectedFriends.includes(friend.id) && { 
                    backgroundColor: themeColors.surfaceSecondary,
                    borderColor: themeColors.primary,
                    borderWidth: 2
                  }
                ]}
                onPress={() => {
                  if (selectedFriends.includes(friend.id)) {
                    setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
                  } else {
                    setSelectedFriends([...selectedFriends, friend.id]);
                  }
                }}
              >
                <View style={styles.friendInfo}>
                  <View style={[styles.friendAvatar, { backgroundColor: themeColors.primary }]}>
                    <Text style={[styles.friendInitial, { color: themeColors.text }]}>
                      {friend.username.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.friendDetails}>
                    <Text style={[styles.friendName, { color: themeColors.text }]}>
                      {friend.username}
                    </Text>
                    <View style={styles.friendStatus}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: friend.isOnline ? themeColors.success : themeColors.textSecondary }
                      ]} />
                      <Text style={[styles.statusText, { color: themeColors.textSecondary }]}>
                        {friend.isOnline ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[
                  styles.selectionIndicator,
                  { 
                    backgroundColor: selectedFriends.includes(friend.id) 
                      ? themeColors.primary 
                      : themeColors.border 
                  }
                ]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: themeColors.primary }]}
          onPress={onNextStep}
        >
          <Text style={[styles.nextButtonText, { color: '#FFFFFF' }]}>
            Continue to Team Selection
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPlayerLobbyScreen = () => (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
                <View style={styles.teamSelectionHeader}>
          <Text style={[styles.screenTitle, { color: themeColors.text }]}>
            Team Selection
          </Text>
          <View style={[styles.inviteCodeDisplay, { borderColor: themeColors.primary }]}>
            <Text style={[styles.inviteCodeText, { color: themeColors.text }]}>
              {inviteCode}
            </Text>
          </View>
        </View>
          
          {/* Team 1 */}
        <View style={[styles.teamSection, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.teamTitle, { color: themeColors.team1 }]}>
            Team 1 ({lobbyDetails.team1Size} slots)
          </Text>
          <View style={styles.teamSlots}>
            {Array.from({ length: parseInt(lobbyDetails.team1Size) }, (_, index) => {
              const player = mockPlayers.find(p => p.team === 'team1' && p.slot === index);
              return (
                <TouchableOpacity
                  key={`team1-${index}`}
                  style={[
                    styles.playerSlot,
                    { 
                      backgroundColor: player ? themeColors.team1 : themeColors.surfaceSecondary,
                      borderColor: player?.username === 'LobbyCreator' ? themeColors.primary : themeColors.team1,
                      borderWidth: player?.username === 'LobbyCreator' ? 3 : 2,
                    }
                  ]}
                  onPress={() => {
                    if (!player) {
                      console.log(`Moving player to Team 1 slot ${index}`);
                    }
                  }}
                  disabled={!!player}
                >
                  {player ? (
                    <>
                      <View style={[styles.playerAvatar, { backgroundColor: themeColors.primary }]}>
                        <Text style={[styles.playerInitial, { color: themeColors.text }]}>
                          {player.username.charAt(0)}
                        </Text>
                      </View>
                      <Text style={[styles.playerUsername, { color: themeColors.text }]}>
                        {player.username}
                      </Text>
                      {player.isReady && (
                        <View style={styles.readyIndicator}>
                          <Text style={[styles.readyCheck, { color: themeColors.success }]}>
                            ✓
                          </Text>
                        </View>
                      )}
                      {player.username === 'LobbyCreator' && (
                        <View style={styles.creatorBadge}>
                          <Text style={[styles.creatorBadgeText, { color: themeColors.primary }]}>
                            Creator
                          </Text>
                        </View>
                      )}
                      
                    </>
                  ) : (
                    <Text style={[styles.emptySlotText, { color: themeColors.textSecondary }]}>
                      Empty Slot
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Team 2 */}
        <View style={[styles.teamSection, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.teamTitle, { color: themeColors.team2 }]}>
            Team 2 ({lobbyDetails.team2Size} slots)
          </Text>
          <View style={styles.teamSlots}>
            {Array.from({ length: parseInt(lobbyDetails.team2Size) }, (_, index) => {
              const player = mockPlayers.find(p => p.team === 'team2' && p.slot === index);
              return (
                <TouchableOpacity
                  key={`team2-${index}`}
                  style={[
                    styles.playerSlot,
                    { 
                      backgroundColor: player ? themeColors.team2 : themeColors.surfaceSecondary,
                      borderColor: themeColors.team2
                    }
                  ]}
                  onPress={() => {
                    if (!player) {
                      console.log(`Moving player to Team 2 slot ${index}`);
                    }
                  }}
                  disabled={!!player}
                >
                  {player ? (
                    <>
                      <View style={[styles.playerAvatar, { backgroundColor: themeColors.primary }]}>
                        <Text style={[styles.playerInitial, { color: themeColors.text }]}>
                          {player.username.charAt(0)}
                        </Text>
                      </View>
                      <Text style={[styles.playerUsername, { color: themeColors.text }]}>
                        {player.username}
                      </Text>
                      {player.isReady && (
                        <View style={styles.readyIndicator}>
                          <Text style={[styles.readyCheck, { color: themeColors.success }]}>
                            ✓
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={[styles.emptySlotText, { color: themeColors.textSecondary }]}>
                      Empty Slot
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

                 {/* Ready Status */}
         <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
           <View style={styles.readyStatusHeader}>
             <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
               Ready Status
             </Text>
             {(() => {
               const lobbyCreator = mockPlayers.find(p => p.username === 'LobbyCreator');
               console.log('Lobby creator state:', lobbyCreator);
               return (
                 <TouchableOpacity 
                   style={[
                     styles.readyToggleButton, 
                     { 
                       backgroundColor: lobbyCreator?.isReady ? themeColors.error : themeColors.success
                     }
                   ]}
                   onPress={toggleLobbyCreatorReady}
                 >
                   <Text style={[styles.readyToggleButtonText, { color: '#FFFFFF' }]}>
                     {lobbyCreator?.isReady ? 'Unready' : 'Ready'}
                   </Text>
                 </TouchableOpacity>
               );
             })()}
           </View>
           <Text style={[styles.readyStatusText, { color: themeColors.textSecondary }]}>
             {actualPlayers.filter(p => p.isReady).length} of {totalExpectedPlayers} players ready
             {allPlayersReady ? ' - All players ready!' : ' - Waiting for players to be ready'}
           </Text>
         </View>

        <TouchableOpacity
          style={[
            styles.nextButton, 
            { 
              backgroundColor: allPlayersReady ? themeColors.primary : themeColors.textSecondary,
              opacity: allPlayersReady ? 1 : 0.5
            }
          ]}
          onPress={onNextStep}
          disabled={!allPlayersReady}
        >
          <Text style={[styles.nextButtonText, { color: '#FFFFFF' }]}>
            Start Battle
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMessageLayerScreen = () => (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <Text style={[styles.screenTitle, { color: themeColors.text }]}>
          Battle Arena
        </Text>
        
        <View style={[styles.battlePlaceholder, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.battlePlaceholderText, { color: themeColors.textSecondary }]}>
            Battle functionality will be implemented here for real-time combat and team coordination.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderJoinLobbyScreen = () => (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <View style={styles.joinLobbyHeader}>
          <Text style={[styles.screenTitle, { color: themeColors.text }]}>
            Join Lobby
          </Text>
          <View style={styles.joinLobbySearchContainer}>
            <View style={[styles.joinLobbySearchInput, { borderColor: themeColors.border }]}>
              <TextInput
                style={[styles.joinLobbyTextInput, { color: themeColors.text }]}
                placeholder="Enter 24-character lobby code..."
                placeholderTextColor={themeColors.textSecondary}
              />
            </View>
            <TouchableOpacity style={[styles.joinLobbyButton, { backgroundColor: themeColors.primary }]}>
              <Text style={[styles.joinLobbyButtonText, { color: '#FFFFFF' }]}>
                Join
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Available Lobbies
          </Text>
          <View style={styles.lobbyCardsContainer}>
            {[
              { id: '1', name: 'Epic Battle Royale', players: 6, maxPlayers: 8, status: 'in-lobby', gameMode: 'ranked', creator: 'BattleMaster' },
              { id: '2', name: 'Quick Duel', players: 2, maxPlayers: 2, status: 'in-lobby', gameMode: 'casual', creator: 'Duelist' },
              { id: '3', name: 'Team Clash', players: 4, maxPlayers: 6, status: 'in-lobby', gameMode: 'ranked', creator: 'TeamLeader' },
              { id: '4', name: 'Friendly Match', players: 3, maxPlayers: 4, status: 'in-lobby', gameMode: 'casual', creator: 'FriendlyPlayer' },
            ].map((lobby) => (
              <TouchableOpacity
                key={lobby.id}
                style={[styles.lobbyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                activeOpacity={0.8}
              >
                <View style={styles.lobbyCardHeader}>
                  <Text style={[styles.lobbyCardTitle, { color: themeColors.text }]}>
                    {lobby.name}
                  </Text>
                  <View style={[styles.lobbyStatusBadge, { backgroundColor: themeColors.primary }]}>
                    <Text style={[styles.lobbyStatusText, { color: '#FFFFFF' }]}>
                      {lobby.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.lobbyCardInfo}>
                  <Text style={[styles.lobbyCardPlayers, { color: themeColors.textSecondary }]}>
                    {lobby.players}/{lobby.maxPlayers} Players
                  </Text>
                  <Text style={[styles.lobbyCardMode, { color: themeColors.textSecondary }]}>
                    {lobby.gameMode.charAt(0).toUpperCase() + lobby.gameMode.slice(1)}
                  </Text>
                  <View style={styles.lobbyCreatorInfo}>
                    <Text style={[styles.lobbyCreatorLabel, { color: themeColors.textSecondary }]}>
                      Created by:
                    </Text>
                    <Text style={[styles.lobbyCreatorName, { color: themeColors.text }]}>
                      {lobby.creator}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderWatchLobbyScreen = () => (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <Text style={[styles.screenTitle, { color: themeColors.text }]}>
          Watch Lobby
        </Text>
        
        <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Active Battles
          </Text>
          <View style={styles.lobbyCardsContainer}>
            {[
              { id: '1', name: 'Clash of Titans', players: 8, maxPlayers: 8, status: 'in-game', gameMode: 'ranked', duration: '5:32', creator: 'TitanSlayer' },
              { id: '2', name: 'Epic Showdown', players: 4, maxPlayers: 4, status: 'in-game', gameMode: 'casual', duration: '2:15', creator: 'EpicGamer' },
              { id: '3', name: 'Battle Royale', players: 6, maxPlayers: 6, status: 'in-game', gameMode: 'ranked', duration: '8:47', creator: 'RoyaleKing' },
            ].map((battle) => (
              <TouchableOpacity
                key={battle.id}
                style={[styles.lobbyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                activeOpacity={0.8}
              >
                <View style={styles.lobbyCardHeader}>
                  <Text style={[styles.lobbyCardTitle, { color: themeColors.text }]}>
                    {battle.name}
                  </Text>
                  <View style={[styles.lobbyStatusBadge, { backgroundColor: themeColors.accent }]}>
                    <Text style={[styles.lobbyStatusText, { color: '#FFFFFF' }]}>
                      IN-GAME
                    </Text>
                  </View>
                </View>
                <View style={styles.lobbyCardInfo}>
                  <Text style={[styles.lobbyCardPlayers, { color: themeColors.textSecondary }]}>
                    {battle.players}/{battle.maxPlayers} Players
                  </Text>
                  <Text style={[styles.lobbyCardMode, { color: themeColors.textSecondary }]}>
                    {battle.duration} • {battle.gameMode.charAt(0).toUpperCase() + battle.gameMode.slice(1)}
                  </Text>
                  <View style={styles.lobbyCreatorInfo}>
                    <Text style={[styles.lobbyCreatorLabel, { color: themeColors.textSecondary }]}>
                      Created by:
                    </Text>
                    <Text style={[styles.lobbyCreatorName, { color: themeColors.text }]}>
                      {battle.creator}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderLobbyCreationPage = () => (
    <ScrollView style={styles.lobbyCreationContent} showsVerticalScrollIndicator={false}>
      {/* Back Arrow Header */}
      <View style={[styles.lobbyCreationHeader, { backgroundColor: themeColors.surface }]}>
        {renderBackArrow()}
        <Text style={[styles.lobbyCreationTitle, { color: themeColors.text }]}>
          Create New Lobby
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Lobby Creation Content */}
      {currentStep === 'lobby-info' && renderLobbyInformationScreen()}
      {currentStep === 'player-invitation' && renderPlayerInvitationScreen()}
      {currentStep === 'player-lobby' && renderPlayerLobbyScreen()}
    </ScrollView>
  );

  const renderCombinedContent = () => (
    <ScrollView style={styles.combinedContent} showsVerticalScrollIndicator={false}>
      {/* Create Section */}
      {renderSectionHeader('Create')}
      <View style={styles.sectionContent}>
        {renderCreateButton()}
      </View>

      {/* Horizontal Stripe */}
      {renderHorizontalStripe()}

      {/* Join Section */}
      {renderSectionHeader('Join')}
      <View style={styles.sectionContent}>
        {renderJoinLobbyScreen()}
      </View>

      {/* Horizontal Stripe */}
      {renderHorizontalStripe()}

      {/* Watch Section */}
      {renderSectionHeader('Watch')}
      <View style={styles.sectionContent}>
        {renderWatchLobbyScreen()}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.mainContainer}>
      {/* Main Container - Conditional Content */}
      <View style={[styles.lobbyContainer, {
        marginHorizontal: 100,
        marginTop: 20,
        backgroundColor: themeColors.background,
        borderColor: themeColors.border,
        borderWidth: 1,
      }]}>
        {showLobbyCreation ? renderLobbyCreationPage() : renderCombinedContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  combinedContent: {
    flex: 1,
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  horizontalStripe: {
    height: 2,
    marginVertical: 8,
  },
  sectionContent: {
    paddingBottom: 20,
  },
  lobbyContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressContainer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  screen: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    padding: 24,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'left',
  },
  teamSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  inviteCodeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },

  inviteCodeText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
  },

  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  lobbyIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  lobbyIdText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  lobbyId: {
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 16,
  },
  copyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  teamConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSizeInput: {
    alignItems: 'center',
    flex: 1,
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdown: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  dropdownArrow: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  teamVS: {
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.7,
  },
  gameModeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  visibilityContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  visibilityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  visibilityButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gameModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  gameModeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gameModeDetails: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteCode: {
    fontSize: 16,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 16,
  },
  friendsList: {
    maxHeight: 300,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendInitial: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  teamSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },

  teamSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  playerSlot: {
    width: 100,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerUsername: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySlotText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  readyIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  creatorBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  readyCheck: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  readyStatusText: {
    fontSize: 14,
    textAlign: 'center',
  },
  readyStatusHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  readyToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  readyToggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  readyButtonContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  playerInvitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  searchAndInviteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 6,
    width: 230,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  bulkInviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  bulkInviteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  battlePlaceholder: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  battlePlaceholderText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },

  battleStatus: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  battleStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  battleStatusText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  chatContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chatPlaceholder: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatInputPlaceholder: {
    fontSize: 14,
    flex: 1,
    opacity: 0.7,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  battleControls: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  battleControlsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  battleControlsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 4,
  },
  joinButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  createButtonContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createMainButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6,
  },
  createMainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  joinLobbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  joinLobbySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: -50,
  },
  joinLobbySearchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 300,
  },
  joinLobbyTextInput: {
    fontSize: 16,
    paddingVertical: 4,
  },
  joinLobbyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  joinLobbyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lobbyCreationContent: {
    flex: 1,
  },
  lobbyCreationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lobbyCreationTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  backArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backArrowText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40, // Same width as back arrow for centering
  },
  lobbyCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  lobbyCard: {
    width: 200,
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    transform: [{ scale: 1 }],
  },
  lobbyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lobbyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  lobbyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  lobbyStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  lobbyCardInfo: {
    alignItems: 'flex-start',
  },
  lobbyCardPlayers: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  lobbyCardMode: {
    fontSize: 12,
    opacity: 0.8,
  },
  lobbyCreatorInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  lobbyCreatorLabel: {
    fontSize: 10,
    opacity: 0.7,
    marginBottom: 2,
  },
  lobbyCreatorName: {
    fontSize: 12,
    fontWeight: '600',
  },
});
