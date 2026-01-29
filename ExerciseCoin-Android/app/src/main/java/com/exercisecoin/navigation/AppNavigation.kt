package com.exercisecoin.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.exercisecoin.features.achievements.AchievementsScreen
import com.exercisecoin.features.auth.LoginScreen
import com.exercisecoin.features.auth.RegisterScreen
import com.exercisecoin.features.exercise.ExerciseScreen
import com.exercisecoin.features.home.HomeScreen
import com.exercisecoin.features.profile.ProfileScreen
import com.exercisecoin.features.transfer.SendCoinsScreen
import com.exercisecoin.features.treasure.TreasureMapScreen
import com.exercisecoin.features.wallet.WalletScreen
import com.exercisecoin.ui.theme.AppColors

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object Exercise : Screen("exercise")
    object Wallet : Screen("wallet")
    object TreasureMap : Screen("treasure_map")
    object Profile : Screen("profile")
    object Achievements : Screen("achievements")
    object SendCoins : Screen("send_coins")
}

sealed class BottomNavItem(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    object Home : BottomNavItem("home", "Home", Icons.Default.Home)
    object Exercise : BottomNavItem("exercise", "Exercise", Icons.Default.DirectionsWalk)
    object Wallet : BottomNavItem("wallet", "Wallet", Icons.Default.AccountBalanceWallet)
    object Map : BottomNavItem("treasure_map", "Map", Icons.Default.Map)
    object Profile : BottomNavItem("profile", "Profile", Icons.Default.Person)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation(
    isAuthenticated: Boolean,
    isLoading: Boolean,
    onLogout: () -> Unit
) {
    if (isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = AppColors.Accent)
        }
        return
    }

    val navController = rememberNavController()

    val bottomNavItems = listOf(
        BottomNavItem.Home,
        BottomNavItem.Exercise,
        BottomNavItem.Wallet,
        BottomNavItem.Map,
        BottomNavItem.Profile
    )

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    val showBottomBar = isAuthenticated && bottomNavItems.any {
        currentDestination?.hierarchy?.any { dest -> dest.route == it.route } == true
    }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = AppColors.Secondary
                ) {
                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            icon = { Icon(item.icon, contentDescription = item.title) },
                            label = { Text(item.title) },
                            selected = currentDestination?.hierarchy?.any { it.route == item.route } == true,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AppColors.Accent,
                                selectedTextColor = AppColors.Accent,
                                unselectedIconColor = AppColors.TextSecondary,
                                unselectedTextColor = AppColors.TextSecondary,
                                indicatorColor = AppColors.Accent.copy(alpha = 0.1f)
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = if (isAuthenticated) Screen.Home.route else Screen.Login.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            // Auth
            composable(Screen.Login.route) {
                LoginScreen(
                    onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                    onLoginSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Register.route) {
                RegisterScreen(
                    onNavigateToLogin = { navController.popBackStack() },
                    onRegisterSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            // Main
            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToSend = { navController.navigate(Screen.SendCoins.route) }
                )
            }

            composable(Screen.Exercise.route) {
                ExerciseScreen()
            }

            composable(Screen.Wallet.route) {
                WalletScreen(
                    onNavigateToSend = { navController.navigate(Screen.SendCoins.route) }
                )
            }

            composable(Screen.TreasureMap.route) {
                TreasureMapScreen()
            }

            composable(Screen.Profile.route) {
                ProfileScreen(
                    onNavigateToAchievements = { navController.navigate(Screen.Achievements.route) },
                    onLogout = {
                        onLogout()
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Achievements.route) {
                AchievementsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.SendCoins.route) {
                SendCoinsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}
